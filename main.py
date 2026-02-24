from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import os
import sys
from dotenv import load_dotenv
import httpx

# Gamification + AI engines (backend/ folder next to main.py)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
try:
    from gamification_engine import (
        process_event as gam_process_event,
        calculate_level,
        build_xp_timeline,
        build_source_breakdown,
        build_weekly_progress,
    )
    from ai_insights import generate_insights
    GAM_ENGINE_AVAILABLE = True
except ImportError as _imp_err:
    print(f"[WARNING] Gamification engine not loaded: {_imp_err}")
    GAM_ENGINE_AVAILABLE = False

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()

# CORS middleware for React frontend
# Allow multiple ports for development (Vite auto-increments when ports are busy)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== PYDANTIC MODELS ==========
class ProfileCreateRequest(BaseModel):
    uid: str
    student_name: str
    student_id: str
    class_section: str
    father_name: str
    mother_name: str
    mobile: str
    email: str
    address: str


class ProfileUpdateRequest(BaseModel):
    student_name: Optional[str] = None
    class_section: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None


class GameCompleteRequest(BaseModel):
    uid: str
    game_name: str
    score: int
    total_questions: Optional[int] = 10
    xp_earned: int


class AlphabetGameCompleteRequest(BaseModel):
    game_name: str
    score: int
    correct_answers: int
    wrong_answers: int
    accuracy: int
    time_spent: int
    level_reached: int
    weak_letters: list


class HomeworkSubmitRequest(BaseModel):
    homework_id: str
    uid: str
    student_answer: str


class AttendanceMarkRequest(BaseModel):
    student_id: str


class GamificationEventRequest(BaseModel):
    uid: str
    event_type: str                       # homework_correct | game_win | game_complete | attendance_present | daily_login
    payload: Optional[dict] = None        # Extra context — score, accuracy, etc.


class ActionCompleteRequest(BaseModel):
    uid: str
    action_type: str     # GAME_COMPLETE | HOMEWORK_COMPLETE | ATTENDANCE_MARK
    metadata: Optional[dict] = None   # score, game_name, subject, etc.


class PerformanceAnalyticsResponse(BaseModel):
    uid: str
    xp_timeline: List[dict]
    source_breakdown: List[dict]
    weekly_progress: List[dict]
    subject_scores: dict
    current_stats: dict
    date: str
    status: str


# ========== HELPER FUNCTIONS ==========
async def verify_supabase_token(authorization: str) -> dict:
    """Verify Supabase JWT token and return user data"""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing authorization")
    
    token = authorization.split('Bearer ')[1]
    
    try:
        # Verify token with Supabase Auth API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_KEY
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            return response.json()
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


async def supabase_query(table: str, method: str = "GET", data: dict = None, filters: dict = None, token: str = None):
    """Execute Supabase REST API query"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    
    # Use user token if provided, otherwise fallback to API key (anon/service)
    auth_header = f"Bearer {token}" if token else f"Bearer {SUPABASE_KEY}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": auth_header,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Add filters to URL
    if filters:
        params = []
        for key, value in filters.items():
            params.append(f"{key}=eq.{value}")
        if params:
            url += "?" + "&".join(params)
    
    async with httpx.AsyncClient() as client:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code not in [200, 201]:
            print(f"Supabase error [{response.status_code}]: {response.text}")
            # If 406 Not Acceptable, it often means empty result for singular return, try to iterate
            raise HTTPException(status_code=response.status_code, detail=f"Supabase Error: {response.text}")
        
        return response.json()


# ========== API ENDPOINTS ==========

# Global OPTIONS handler for CORS preflight requests
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle CORS preflight requests for all routes"""
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

@app.get("/")
def root():
    return {"message": "Student Dashboard API - Powered by Supabase", "status": "running"}


@app.get("/api/dashboard/{uid}")
async def get_dashboard_data(
    uid: str,
    authorization: str = Header(None)
):
    """Get student dashboard data"""
    try:
        user_token = None
        
        # Verify token if provided
        if authorization:
            if authorization.startswith('Bearer '):
                user_token = authorization.split('Bearer ')[1]
            
            user_data = await verify_supabase_token(authorization)
            if user_data.get("id") != uid:
                raise HTTPException(status_code=403, detail="Unauthorized access")
        
        # Fetch parent data from Supabase using user token
        parents = await supabase_query("parents", filters={"uid": uid}, token=user_token)
        
        if parents and len(parents) > 0:
            parent = parents[0]
            print(f"Found existing parent data for {uid}")
            # Ensure all KPI fields exist (add defaults if missing)
            parent.setdefault('attendance_streak', parent.get('streak', 5))
            parent.setdefault('streak', 5)
            parent.setdefault('badges', [])
            parent.setdefault('achievements', [])
        else:
            print(f"Creating new parent data for {uid}")
            # Create default parent document if doesn't exist
            parent = {
                "uid": uid,
                "student_name": "Student Name",
                "student_id": uid[:8],
                "father_name": "Father Name",
                "mother_name": "Mother Name",
                "class_section": "1-A",
                "mobile": "Not provided",
                "address": "Not provided",
                "email": "Authenticated User",
                # KPI Data
                "attendance_percentage": 95,
                "present_days": 152,
                "absent_days": 8,
                "total_days": 160,
                "attendance_streak": 5,
                "homework_completed": 12,
                "homework_total": 15,
                "reward_points": 450,
                "achievement_stars": 23,
                "streak": 5,
                "badges": [],
                "achievements": [],
                "games_played": 0,
                "high_score": 0,
                "current_level": 1
            }
            # Save default data using user token (or service/anon if token is null, but likely needs token)
            await supabase_query("parents", method="POST", data=parent, token=user_token)
        
        return JSONResponse(parent)
        
    except Exception as e:
        print(f"Dashboard error: {e}")
        # Return fallback data
        return JSONResponse({
            "uid": uid,
            "student_name": "Student Name",
            "student_id": uid[:8],
            "father_name": "Father Name",
            "mother_name": "Mother Name",
            "class_section": "1-A",
            "mobile": "Not provided",
            "address": "Not provided",
            "email": "Authenticated User",
            "attendance_percentage": 95,
            "present_days": 152,
            "absent_days": 8,
            "total_days": 160,
            "attendance_streak": 5,
            "homework_completed": 12,
            "homework_total": 15,
            "reward_points": 450,
            "achievement_stars": 23,
            "streak": 5,
            "badges": [],
            "achievements": [],
            "games_played": 0,
            "high_score": 0,
            "current_level": 1
        })


@app.get("/api/profile/check/{uid}")
async def check_profile(
    uid: str,
    authorization: str = Header(None)
):
    """
    Check if user profile exists in database.
    Returns: { "exists": true/false, "profile": {...} or null }
    """
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]
            
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        auth_uid = user_data.get("id")
        
        # Verify user is checking their own profile
        if auth_uid != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Check if profile exists in database
        profiles = await supabase_query("parents", filters={"uid": uid}, token=user_token)
        
        if profiles and len(profiles) > 0:
            # Profile exists
            return JSONResponse({
                "exists": True,
                "profile": profiles[0]
            })
        else:
            # Profile does NOT exist
            return JSONResponse({
                "exists": False,
                "profile": None
            })
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile check error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check profile: {str(e)}")


@app.post("/api/profile/create")
async def create_profile(
    profile_data: ProfileCreateRequest,
    authorization: str = Header(None)
):
    """Create a new student profile"""
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]
            
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        uid = user_data.get("id")
        
        # Verify user is creating their own profile
        if uid != profile_data.uid:
            raise HTTPException(status_code=403, detail="Unauthorized to create profile for another user")
        
        # Check if profile already exists
        existing = await supabase_query("parents", filters={"uid": uid}, token=user_token)
        if existing and len(existing) > 0:
            raise HTTPException(status_code=400, detail="Profile already exists. Use update endpoint instead.")
        
        # Create new profile with default KPI values
        new_profile = {
            "uid": profile_data.uid,
            "student_name": profile_data.student_name,
            "student_id": profile_data.student_id,
            "class_section": profile_data.class_section,
            "father_name": profile_data.father_name,
            "mother_name": profile_data.mother_name,
            "mobile": profile_data.mobile,
            "email": profile_data.email,
            "address": profile_data.address,
            # Default KPI values
            "attendance_percentage": 95,
            "present_days": 0,
            "absent_days": 0,
            "total_days": 0,
            "attendance_streak": 0,
            "homework_completed": 0,
            "homework_total": 0,
            "reward_points": 0,
            "achievement_stars": 0,
            "streak": 0,
            "badges": [],
            "achievements": [],
            "games_played": 0,
            "high_score": 0,
            "current_level": 1
        }
        
        # Insert into database
        result = await supabase_query("parents", method="POST", data=new_profile, token=user_token)
        
        if result and len(result) > 0:
            return JSONResponse(result[0])
        else:
            return JSONResponse(new_profile)
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")


@app.patch("/api/profile/{uid}")
async def update_profile(
    uid: str,
    profile_data: ProfileUpdateRequest,
    authorization: str = Header(None)
):
    """Update student profile (allowed fields only)"""
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]
            
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        user_uid = user_data.get("id")
        
        # Verify user is updating their own profile
        if user_uid != uid:
            raise HTTPException(status_code=403, detail="Unauthorized to update another user's profile")
        
        # Build update data (only include fields that were provided)
        update_data = {}
        if profile_data.student_name is not None:
            update_data["student_name"] = profile_data.student_name
        if profile_data.class_section is not None:
            update_data["class_section"] = profile_data.class_section
        if profile_data.father_name is not None:
            update_data["father_name"] = profile_data.father_name
        if profile_data.mother_name is not None:
            update_data["mother_name"] = profile_data.mother_name
        if profile_data.mobile is not None:
            update_data["mobile"] = profile_data.mobile
        if profile_data.address is not None:
            update_data["address"] = profile_data.address
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now().isoformat()
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update in database
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        url = f"{SUPABASE_URL}/rest/v1/parents?uid=eq.{uid}"
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(url, headers=headers, json=update_data)
            
            if response.status_code not in [200, 204]:
                print(f"Update error [{response.status_code}]: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Update failed: {response.text}")
            
            # Fetch updated profile
            updated = await supabase_query("parents", filters={"uid": uid}, token=user_token)
            if updated and len(updated) > 0:
                return JSONResponse(updated[0])
            else:
                raise HTTPException(status_code=404, detail="Profile not found after update")
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@app.get("/api/homework/{uid}")
async def get_student_homework(
    uid: str,
    authorization: str = Header(None)
):
    """Get student homework assignments with pending/completed status - Class 1"""
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]
            
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        auth_uid = user_data.get("id")
        
        # Verify user is accessing their own data
        if auth_uid != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Get student's class section
        parents = await supabase_query("parents", filters={"uid": uid}, token=user_token)
        if not parents or len(parents) == 0:
            raise HTTPException(status_code=404, detail="Student profile not found")
        
        student_class = parents[0].get("class_section", "1-A")
        
        # Get all homework for student's class (use service key so all authenticated students can read)
        try:
            homework_list = await supabase_query(
                "homework",
                filters={"class_section": student_class},
                token=SUPABASE_KEY  # service key — homework is publicly readable by design
            )
            
            if not homework_list:
                homework_list = []
        except Exception as hw_error:
            print(f"Homework table query error: {hw_error}")
            homework_list = []
        
        # Get student's submissions (use user token — RLS ensures own records only)
        try:
            submissions = await supabase_query(
                "homework_submissions",
                filters={"student_uid": uid},
                token=user_token
            )
        except Exception as sub_error:
            print(f"Submissions table query error: {sub_error}")
            submissions = []
        
        # Create a set of completed homework IDs
        completed_ids = {sub["homework_id"] for sub in (submissions or [])}
        
        # Split homework into pending and completed
        pending = []
        completed = []
        
        for hw in homework_list:
            hw_data = {
                "id": hw["id"],
                "title": hw["title"],
                "subject": hw["subject"],
                "question": hw.get("question", ""),
                "xp_reward": hw.get("xp_reward", 5),
                "created_at": hw.get("created_at", "")
            }
            
            if hw["id"] in completed_ids:
                # Find completion timestamp and student answer
                completion = next((s for s in submissions if s["homework_id"] == hw["id"]), None)
                if completion:
                    hw_data["completed_at"] = completion.get("completed_at", "")
                    hw_data["student_answer"] = completion.get("student_answer", "")
                completed.append(hw_data)
            else:
                pending.append(hw_data)
        
        # Calculate stats
        total = len(homework_list)
        completed_count = len(completed)
        pending_count = len(pending)
        completion_rate = round((completed_count / total * 100) if total > 0 else 0, 1)
        
        return {
            "pending": pending,
            "completed": completed,
            "stats": {
                "total": total,
                "completed": completed_count,
                "pending": pending_count,
                "completion_rate": completion_rate
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get homework error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get homework: {str(e)}")


@app.post("/api/homework/submit")
async def submit_homework(
    homework_data: HomeworkSubmitRequest,
    authorization: str = Header(None)
):
    """
    Submit homework answer with validation.
    Awards XP if correct, prevents duplicate submissions.
    """
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]
            
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        auth_uid = user_data.get("id")
        
        # Verify user is submitting their own homework
        if auth_uid != homework_data.uid:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Check if homework tables exist
        try:
            # Check if already completed (prevent duplicate)
            existing = await supabase_query(
                "homework_submissions",
                filters={
                    "homework_id": homework_data.homework_id,
                    "student_uid": homework_data.uid
                },
                token=user_token
            )
            
            if existing and len(existing) > 0:
                raise HTTPException(status_code=400, detail="Homework already completed")
            
            # Get homework details for answer validation
            homework = await supabase_query(
                "homework",
                filters={"id": homework_data.homework_id},
                token=user_token
            )
            
            if not homework or len(homework) == 0:
                raise HTTPException(status_code=404, detail="Homework not found")
        except HTTPException:
            raise
        except Exception as table_error:
            print(f"Homework tables not found: {table_error}")
            raise HTTPException(
                status_code=503, 
                detail="Homework system not set up yet. Please run homework_system_setup.sql in Supabase dashboard."
            )
        
        homework_item = homework[0]
        correct_answer = homework_item.get("correct_answer", "").strip()
        student_answer = homework_data.student_answer.strip()
        xp_reward = homework_item.get("xp_reward", 5)
        
        # Validate answer (case-insensitive comparison)
        is_correct = correct_answer.lower() == student_answer.lower()
        
        if not is_correct:
            return {
                "success": False,
                "correct": False,
                "message": "Incorrect answer. Try again!",
                "correct_answer": None  # Don't reveal correct answer
            }
        
        # Answer is correct — record submission and award XP
        submission_data = {
            "homework_id": homework_data.homework_id,
            "student_uid": homework_data.uid,
            "student_answer": student_answer,
            "completed_at": datetime.now().isoformat()
        }
        
        await supabase_query(
            "homework_submissions",
            method="POST",
            data=submission_data,
            token=user_token
        )
        
        # Get current parent data
        parents = await supabase_query(
            "parents",
            filters={"uid": homework_data.uid},
            token=user_token
        )
        
        if not parents or len(parents) == 0:
            raise HTTPException(status_code=404, detail="Student profile not found")
        
        parent_record = parents[0]
        current_points = parent_record.get("reward_points", 0)
        new_points = current_points + xp_reward

        # Get updated homework stats
        student_class = parent_record.get("class_section", "1-A")
        try:
            homework_list = await supabase_query(
                "homework",
                filters={"class_section": student_class},
                token=SUPABASE_KEY
            )
            
            all_submissions = await supabase_query(
                "homework_submissions",
                filters={"student_uid": homework_data.uid},
                token=user_token
            )
            
            total = len(homework_list) if homework_list else 0
            completed_count = len(all_submissions) if all_submissions else 0
        except Exception as stats_error:
            print(f"Error fetching homework stats: {stats_error}")
            total = 6
            completed_count = 1
        
        pending_count = total - completed_count
        completion_rate = round((completed_count / total * 100) if total > 0 else 0, 1)

        # Badge unlock logic
        existing_badges = parent_record.get("badges") or []
        if isinstance(existing_badges, str):
            import json as _json
            try:
                existing_badges = _json.loads(existing_badges)
            except Exception:
                existing_badges = []
        
        new_badge = None
        existing_badge_ids = [b.get("id") if isinstance(b, dict) else b for b in existing_badges]

        if completed_count == 1 and "homework_starter" not in existing_badge_ids:
            new_badge = {
                "id": "homework_starter",
                "name": "Homework Starter",
                "icon": "📝",
                "description": "Completed your first homework!"
            }
            existing_badges.append(new_badge)
        elif completed_count >= total and total > 0 and "homework_champion" not in existing_badge_ids:
            new_badge = {
                "id": "homework_champion",
                "name": "Homework Champion",
                "icon": "🏆",
                "description": "Completed all homework assignments!"
            }
            existing_badges.append(new_badge)

        # Update reward_points + badges atomically
        update_data = {"reward_points": new_points}
        if new_badge is not None:
            update_data["badges"] = existing_badges

        await supabase_query(
            "parents",
            method="PATCH",
            data=update_data,
            filters={"uid": homework_data.uid},
            token=user_token
        )
        
        return {
            "success": True,
            "correct": True,
            "message": "Correct! Well done! 🎉",
            "xp_earned": xp_reward,
            "total_xp": new_points,
            "homework_id": homework_data.homework_id,
            "new_badge": new_badge,
            "stats": {
                "total": total,
                "completed": completed_count,
                "pending": pending_count,
                "completion_rate": completion_rate
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Submit homework error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit homework: {str(e)}")


# ========== ATTENDANCE ENDPOINTS ==========
@app.get("/api/attendance/{uid}")
async def get_student_attendance(
    uid: str,
    authorization: str = Header(None)
):
    """Get student attendance records with monthly data"""
    try:
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        auth_uid = user_data.get("id")
        
        # Verify user is accessing their own data
        if auth_uid != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Generate mock attendance data for the current month and previous months
        from datetime import datetime, timedelta
        import random
        
        today = datetime.now()
        records = []
        
        # Generate data for the last 60 days
        for i in range(60, 0, -1):
            date = today - timedelta(days=i)
            # 90% chance of being present
            status = 'present' if random.random() < 0.90 else 'absent'
            records.append({
                'date': date.strftime('%Y-%m-%d'),
                'status': status
            })
        
        # Calculate monthly data
        monthly_data = []
        for month_offset in range(3, 0, -1):
            month_start = today - timedelta(days=30 * month_offset)
            month_records = [r for r in records if r['date'].startswith(month_start.strftime('%Y-%m'))]
            present_count = len([r for r in month_records if r['status'] == 'present'])
            total_count = len(month_records)
            
            monthly_data.append({
                'month': month_start.strftime('%B %Y'),
                'present': present_count,
                'total': total_count,
                'percentage': round((present_count / total_count * 100) if total_count > 0 else 0, 1)
            })
        
        return {
            "records": records,
            "monthlyData": monthly_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get attendance error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get attendance: {str(e)}")


@app.post("/api/attendance")
async def mark_student_attendance(
    attendance_data: AttendanceMarkRequest,
    authorization: str = Header(None)
):
    """Mark student attendance for a specific date"""
    try:
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        auth_uid = user_data.get("id")
        
        # Verify user is accessing their own data
        if auth_uid != attendance_data.student_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # For now, just return success (would save to database in production)
        return {
            "success": True,
            "message": "Attendance marked successfully",
            "date": attendance_data.date,
            "status": attendance_data.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Mark attendance error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark attendance: {str(e)}")


@app.post("/api/game/complete")
async def complete_game(
    game_data: GameCompleteRequest,
    authorization: str = Header(None)
):
    """
    Complete a game session — full gamification sync.
    1. Snapshot current XP/level for delta detection.
    2. Insert game_sessions row (DB trigger updates reward_points & games_played).
    3. Check & award badges via RPC.
    4. Fetch refreshed parent row.
    5. Insert user_activity log (best-effort).
    6. Return full gamification state so Redux can update all UI sections instantly.
    """
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        auth_uid = user_data.get("id")

        if auth_uid != game_data.uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        api_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

        async with httpx.AsyncClient() as client:
            # ── Step 1: snapshot current state for delta comparison ──
            pre_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/parents?uid=eq.{game_data.uid}&select=reward_points,streak,badges",
                headers=api_headers
            )
            old_xp = 0
            if pre_resp.status_code == 200 and pre_resp.json():
                old_xp = pre_resp.json()[0].get("reward_points", 0)
            old_level = min((old_xp // 100) + 1, 50)

            # ── Step 2: insert game session ──
            session_resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/game_sessions",
                headers=api_headers,
                json={
                    "student_uid":     game_data.uid,
                    "game_name":       game_data.game_name,
                    "score":           game_data.score,
                    "total_questions": game_data.total_questions,
                    "xp_earned":       game_data.xp_earned,
                    "played_at":       datetime.now().isoformat(),
                }
            )
            if session_resp.status_code != 201:
                raise HTTPException(status_code=500, detail="Failed to save game session")

            # ── Step 3: badge check RPC (best-effort) ──
            badge_resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/check_and_award_badges",
                headers=api_headers,
                json={"p_student_uid": game_data.uid}
            )
            new_badges = badge_resp.json() if badge_resp.status_code == 200 else []

            # ── Step 4: fetch refreshed parent row ──
            post_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/parents?uid=eq.{game_data.uid}&select=*",
                headers=api_headers
            )
            if post_resp.status_code != 200 or not post_resp.json():
                raise HTTPException(status_code=500, detail="Failed to fetch updated stats")

        parent_data      = post_resp.json()[0]
        total_xp         = parent_data.get("reward_points", 0)
        level            = min((total_xp // 100) + 1, 50)
        current_level_xp = total_xp % 100
        xp_to_next       = 100 - current_level_xp
        streak           = parent_data.get("streak", 0)
        badges           = parent_data.get("badges", [])
        leveled_up       = level > old_level
        new_badge        = None
        if new_badges:
            first = new_badges[0]
            new_badge = first if isinstance(first, dict) else {"name": first}

        # ── Step 5: insert activity log (best-effort) ──
        activity_entry = None
        try:
            activity_entry = {
                "uid":         game_data.uid,
                "action_type": "GAME_COMPLETE",
                "xp_earned":   game_data.xp_earned,
                "label":       f"{game_data.game_name} Completed",
                "icon":        "\U0001f3ae",
                "timestamp":   datetime.now().isoformat(),
            }
            await supabase_query(
                "user_activity",
                method="POST",
                data={**activity_entry, "created_at": datetime.now().isoformat()},
                token=user_token
            )
        except Exception:
            pass  # table may not exist yet

        return JSONResponse({
            "success":          True,
            "game_name":        game_data.game_name,
            "xp_earned":        game_data.xp_earned,
            "total_xp":         total_xp,
            "level":            level,
            "current_level_xp": current_level_xp,
            "xp_to_next_level": xp_to_next,
            "xp_progress":      current_level_xp,
            "streak":           streak,
            "games_played":     parent_data.get("games_played", 0),
            "total_game_xp":    parent_data.get("total_game_xp", 0),
            "badges":           badges,
            "new_badges":       new_badges,
            "new_badge":        new_badge,
            "leveled_up":       leveled_up,
            "activity_entry":   activity_entry,
            "message":          "Game completed! \U0001f389",
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Game completion error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to complete game: {str(e)}")


@app.get("/api/games/stats/{uid}")
async def get_games_stats(
    uid: str,
    authorization: str = Header(None)
):
    """
    Get comprehensive game statistics for a student.
    Returns total games, XP, badges, level, and recent sessions.
    """
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]
            
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        auth_uid = user_data.get("id")
        
        # Verify user is checking their own stats
        if auth_uid != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {user_token}"
        }
        
        async with httpx.AsyncClient() as client:
            # Get parent data
            parent_url = f"{SUPABASE_URL}/rest/v1/parents?uid=eq.{uid}&select=*"
            parent_response = await client.get(parent_url, headers=headers)
            
            if parent_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch student data")
            
            parents = parent_response.json()
            if not parents or len(parents) == 0:
                return JSONResponse({
                    "total_games": 0,
                    "total_xp": 0,
                    "total_game_xp": 0,
                    "games_played": 0,
                    "badges": [],
                    "current_level": 1,
                    "recent_sessions": []
                })
            
            parent_data = parents[0]
            total_xp = parent_data.get("reward_points", 0)
            level = min((total_xp // 100) + 1, 50)
            
            # Get recent game sessions
            sessions_url = f"{SUPABASE_URL}/rest/v1/game_sessions?student_uid=eq.{uid}&order=played_at.desc&limit=10&select=*"
            sessions_response = await client.get(sessions_url, headers=headers)
            
            recent_sessions = sessions_response.json() if sessions_response.status_code == 200 else []
            
            current_level_xp = total_xp % 100
            xp_to_next = 100 - current_level_xp

            return JSONResponse({
                "total_games": parent_data.get("games_played", 0),
                "total_xp": total_xp,
                "total_game_xp": parent_data.get("total_game_xp", 0),
                "games_played": parent_data.get("games_played", 0),
                "badges": parent_data.get("badges", []),
                "current_level": level,
                "current_level_xp": current_level_xp,
                "xp_to_next_level": xp_to_next,
                "recent_sessions": recent_sessions,
                "success": True
            })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get games stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.get("/api/analytics/student/{uid}")
async def get_student_analytics(
    uid: str,
    authorization: str = Header(None)
):
    """Get student game analytics"""
    try:
        # Verify authorization
        user_data = await verify_supabase_token(authorization)
        
        if user_data.get("id") != uid:
            raise HTTPException(status_code=403, detail="Unauthorized access")
            
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]
        
        # Get recent game sessions
        url = f"{SUPABASE_URL}/rest/v1/game_sessions?student_id=eq.{uid}&order=played_at.desc&limit=10"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {user_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            sessions_list = response.json() if response.status_code == 200 else []
        
        total_accuracy = sum(s.get("accuracy", 0) for s in sessions_list)
        total_time = sum(s.get("time_spent", 0) for s in sessions_list)
        
        avg_accuracy = total_accuracy / len(sessions_list) if sessions_list else 0
        avg_time = total_time / len(sessions_list) if sessions_list else 0
        
        return JSONResponse({
            "recent_sessions": sessions_list,
            "average_accuracy": round(avg_accuracy, 2),
            "average_time_spent": round(avg_time, 2),
            "total_sessions": len(sessions_list)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ANNOUNCEMENTS ENDPOINTS
# ============================================================

class AnnouncementReadRequest(BaseModel):
    uid: str
    announcement_id: str

@app.get("/api/announcements/{uid}")
async def get_announcements(
    uid: str,
    authorization: str = Header(None)
):
    """Get all announcements with read status for the student"""
    try:
        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != uid:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        headers_auth = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {user_token}"
        }
        headers_service = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }

        async with httpx.AsyncClient() as client:
            # Step 1: Check announcement count
            count_url = f"{SUPABASE_URL}/rest/v1/announcements?select=id"
            count_resp = await client.get(count_url, headers=headers_service)
            
            # Auto-seed if less than 10 announcements
            if count_resp.status_code == 200:
                count_data = count_resp.json()
                record_count = len(count_data) if isinstance(count_data, list) else 0
                
                if record_count < 10:
                    # Insert full school announcement dataset
                    seed_data = [
                        # STUDENT CATEGORY
                        {"title": "📚 Homework Reminder", "description": "Dear students, please complete your Math homework (pages 12-15) and submit tomorrow. Remember to show all your working steps!", "category": "student", "priority": "normal"},
                        {"title": "📖 Library Visit Day", "description": "Class 1-A will visit the school library on Friday at 10 AM. Bring your library cards to borrow exciting storybooks!", "category": "student", "priority": "normal"},
                        {"title": "🎨 Art & Craft Materials", "description": "For tomorrow's art class, please bring: colored papers, glue stick, scissors, and crayons. We'll be making a beautiful craft project!", "category": "student", "priority": "normal"},
                        {"title": "💧 Water Bottle Reminder", "description": "Don't forget to bring your water bottle every day! Stay hydrated and healthy. Keep it in your school bag.", "category": "student", "priority": "normal"},
                        
                        # MEETING CATEGORY
                        {"title": "👨‍👩‍👧 Parent-Teacher Meeting", "description": "Important! Parent-Teacher Meeting scheduled for Saturday, Feb 25th at 9:00 AM. Please ensure your parents attend to discuss your academic progress.", "category": "meeting", "priority": "high"},
                        {"title": "📊 Academic Progress Review", "description": "Monthly academic review meeting for all Class-1 parents. Discuss your child's performance, strengths, and areas for improvement.", "category": "meeting", "priority": "high"},
                        {"title": "🎓 Orientation Meeting", "description": "New session orientation for parents on March 5th. Learn about upcoming curriculum changes and school activities.", "category": "meeting", "priority": "normal"},
                        
                        # EVENT CATEGORY
                        {"title": "🎭 Annual Day Celebration", "description": "Our grand Annual Day celebration is on March 15th! Students will perform dances, skits, and songs. Practice sessions start next week!", "category": "event", "priority": "normal"},
                        {"title": "🤡 Fancy Dress Competition", "description": "Exciting Fancy Dress Competition on Feb 28th! Choose your favorite character - superhero, cartoon, or fairy tale. Prizes for best costumes!", "category": "event", "priority": "normal"},
                        {"title": "🖍️ Drawing Competition", "description": "Inter-class drawing competition on March 2nd. Topic: 'My Dream School'. Bring your own colors and drawing sheets!", "category": "event", "priority": "normal"},
                        {"title": "🔬 Science Activity Day", "description": "Fun Science Activity Day on March 8th! Learn through exciting experiments and demonstrations. Parents are invited to watch!", "category": "event", "priority": "normal"},
                        
                        # SPORTS CATEGORY
                        {"title": "⚽ Sports Day", "description": "Annual Sports Day on March 20th! Events include: running races, relay, sack race, and balloon games. Wear your house color dress!", "category": "sports", "priority": "normal"},
                        {"title": "🏃 Running Race Competition", "description": "Practice sessions for Running Race Competition start next week. Students interested in participating, please give your names to the sports teacher.", "category": "sports", "priority": "normal"},
                        {"title": "🧘 Yoga Activity", "description": "Special Yoga session every Wednesday morning! Learn simple yoga poses for better concentration and fitness. Wear comfortable clothes.", "category": "sports", "priority": "normal"},
                        
                        # HOLIDAY CATEGORY
                        {"title": "🏖️ National Holiday", "description": "School will remain closed on Feb 26th (National Holiday). Enjoy your day with family. School reopens on Feb 27th.", "category": "holiday", "priority": "normal"},
                        {"title": "🎊 Festival Holiday", "description": "Holi festival holidays from March 12-14. School reopens on March 15th. Have a colorful and safe celebration!", "category": "holiday", "priority": "normal"},
                        {"title": "☀️ Summer Vacation Notice", "description": "Summer vacation dates announced! Holidays from May 15 to June 30. Online homework portal will be active for assignment submission.", "category": "holiday", "priority": "normal"},
                        
                        # IMPORTANT CATEGORY
                        {"title": "⚠️ Exam Schedule Released", "description": "First Terminal Exam schedule is now available! Exams from March 25-30. Download the detailed timetable from the student portal. Start preparation!", "category": "important", "priority": "high"},
                        {"title": "⚠️ Safety Guidelines", "description": "Important safety reminder: Always use the designated entry/exit gates. Parents must show ID cards during pickup. Follow traffic rules in the school zone.", "category": "important", "priority": "high"},
                        {"title": "🏥 Health Checkup Camp", "description": "Free health checkup camp on March 10th at 11 AM. Doctors will check height, weight, vision, and dental health. Reports will be shared with parents.", "category": "important", "priority": "high"},
                        {"title": "📱 School App Update", "description": "New school mobile app launched! Download 'Student Dashboard' from Play Store/App Store. Track homework, attendance, and announcements easily!", "category": "important", "priority": "high"},
                        {"title": "🚌 School Bus Route Change", "description": "Important! Bus Route 3 timing changed from 7:30 AM to 7:45 AM starting March 1st. Pickup points remain the same. Plan accordingly.", "category": "important", "priority": "high"},
                    ]
                    
                    try:
                        bulk_url = f"{SUPABASE_URL}/rest/v1/announcements"
                        headers_insert = {**headers_service, "Prefer": "return=minimal"}
                        seed_resp = await client.post(bulk_url, json=seed_data, headers=headers_insert)
                        print(f"Auto-seed response status: {seed_resp.status_code}")
                        if seed_resp.status_code not in [200, 201]:
                            print(f"Seed failed: {seed_resp.text}")
                    except Exception as e:
                        print(f"Auto-seed error: {e}")
            
            # Fetch all announcements
            ann_url = f"{SUPABASE_URL}/rest/v1/announcements?order=created_at.desc"
            ann_resp = await client.get(ann_url, headers=headers_service)
            announcements = ann_resp.json() if ann_resp.status_code == 200 else []

            # Fetch this student's read records
            reads_url = f"{SUPABASE_URL}/rest/v1/announcement_reads?student_uid=eq.{uid}&select=announcement_id"
            reads_resp = await client.get(reads_url, headers=headers_auth)
            reads_data = reads_resp.json() if reads_resp.status_code == 200 else []

        read_ids = {r["announcement_id"] for r in reads_data if isinstance(r, dict)}

        # Annotate each announcement with read status
        for ann in announcements:
            ann["is_read"] = ann.get("id") in read_ids

        unread_count = sum(1 for a in announcements if not a.get("is_read"))

        return JSONResponse({
            "announcements": announcements,
            "unread_count": unread_count,
            "success": True
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get announcements error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch announcements: {str(e)}")


@app.post("/api/announcement/read")
async def mark_announcement_read(
    request: AnnouncementReadRequest,
    authorization: str = Header(None)
):
    """Mark an announcement as read for the student"""
    try:
        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != request.uid:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        headers_auth = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        async with httpx.AsyncClient() as client:
            # Insert read record (ON CONFLICT DO NOTHING via UNIQUE constraint)
            url = f"{SUPABASE_URL}/rest/v1/announcement_reads"
            payload = {
                "announcement_id": request.announcement_id,
                "student_uid": request.uid
            }
            # Supabase upsert — ignore conflict
            headers_upsert = {**headers_auth, "Prefer": "resolution=ignore-duplicates,return=minimal"}
            resp = await client.post(url, json=payload, headers=headers_upsert)

            # Re-fetch unread count
            reads_url = f"{SUPABASE_URL}/rest/v1/announcement_reads?student_uid=eq.{request.uid}&select=announcement_id"
            reads_resp = await client.get(reads_url, headers=headers_auth)
            reads_data = reads_resp.json() if reads_resp.status_code == 200 else []

            ann_url = f"{SUPABASE_URL}/rest/v1/announcements?select=id"
            ann_resp = await client.get(ann_url, headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            })
            all_announcements = ann_resp.json() if ann_resp.status_code == 200 else []

        read_ids = {r["announcement_id"] for r in reads_data if isinstance(r, dict)}
        unread_count = sum(1 for a in all_announcements if a.get("id") not in read_ids)

        return JSONResponse({
            "success": True,
            "announcement_id": request.announcement_id,
            "unread_count": unread_count,
            "message": "Marked as read"
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Mark announcement read error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark as read: {str(e)}")


# ═══════════════════════════════════════════════════════════════
# UNIFIED ACTION COMPLETE — SINGLE SOURCE OF TRUTH
# ═══════════════════════════════════════════════════════════════

# Maps frontend action_type strings to engine event_type strings
_ACTION_TO_EVENT = {
    "GAME_COMPLETE":     "game_win",
    "HOMEWORK_COMPLETE": "homework_correct",
    "ATTENDANCE_MARK":   "attendance_present",
    "game_complete":     "game_win",
    "homework_complete": "homework_correct",
    "attendance_mark":   "attendance_present",
}


@app.post("/api/action/complete")
async def action_complete(
    req: ActionCompleteRequest,
    authorization: str = Header(None)
):
    """
    Unified gamification trigger.

    Any client-side action (game, homework, attendance) calls this endpoint.
    The gamification engine processes XP / level / badge / streak in one place
    and returns the full updated state so the frontend can do a single Redux dispatch.

    Response includes:
        total_xp, level, xp_progress, streak,
        badges, new_badge, leveled_up,
        activity_entry, xp_earned
    """
    try:
        if not GAM_ENGINE_AVAILABLE:
            raise HTTPException(status_code=503, detail="Gamification engine unavailable")

        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != req.uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Map action_type → engine event_type
        event_type = _ACTION_TO_EVENT.get(req.action_type)
        if not event_type:
            raise HTTPException(status_code=400, detail=f"Unknown action_type: {req.action_type}")

        # Fetch current student record
        parents = await supabase_query("parents", filters={"uid": req.uid}, token=user_token)
        if not parents:
            raise HTTPException(status_code=404, detail="Student profile not found")
        student_record = parents[0]

        # Run the central engine
        update_dict = gam_process_event(
            event_type=event_type,
            student_record=student_record,
            event_payload=req.metadata or {}
        )
        meta = update_dict.pop("_meta", {})
        persist_fields = {k: v for k, v in update_dict.items() if not k.startswith("_")}

        # Persist to parents table
        if persist_fields:
            hdrs = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {user_token}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            async with httpx.AsyncClient() as client:
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/parents?uid=eq.{req.uid}",
                    headers=hdrs,
                    json=persist_fields
                )

        # Insert into user_activity log (best-effort)
        activity_entry = None
        try:
            meta_info = req.metadata or {}
            activity_entry = {
                "uid": req.uid,
                "action_type": req.action_type,
                "xp_earned": meta.get("xp_earned", 0),
                "label": meta_info.get("label") or req.action_type.replace("_", " ").title(),
                "icon": meta_info.get("icon") or (
                    "🎮" if "GAME" in req.action_type.upper() else
                    "📚" if "HOMEWORK" in req.action_type.upper() else "📅"
                ),
                "timestamp": datetime.now().isoformat(),
            }
            await supabase_query(
                "user_activity",
                method="POST",
                data={**activity_entry, "created_at": datetime.now().isoformat()},
                token=user_token
            )
        except Exception:
            pass  # Table may not exist yet

        # Also record in xp_events for analytics (best-effort)
        try:
            await supabase_query(
                "xp_events",
                method="POST",
                data={
                    "uid": req.uid,
                    "event_type": event_type,
                    "xp_earned": meta.get("xp_earned", 0),
                    "source": req.action_type.split("_")[0].lower(),
                    "date": datetime.now().date().isoformat(),
                    "created_at": datetime.now().isoformat()
                },
                token=user_token
            )
        except Exception:
            pass

        total_xp = meta.get("total_xp", persist_fields.get("reward_points", 0))
        new_level = meta.get("new_level", persist_fields.get("current_level", 1))
        new_badges = meta.get("new_badges", [])

        return JSONResponse({
            "success": True,
            "action_type": req.action_type,
            "xp_earned": meta.get("xp_earned", 0),
            "total_xp": total_xp,
            "level": new_level,
            "xp_progress": total_xp % 100,
            "xp_to_next_level": 100 - (total_xp % 100),
            "streak": persist_fields.get("streak", student_record.get("streak", 0)),
            "streak_milestone": meta.get("streak_milestone", False),
            "badges": persist_fields.get("badges", student_record.get("badges", [])),
            "new_badge": new_badges[0] if new_badges else None,
            "leveled_up": meta.get("level_up", False),
            "activity_entry": activity_entry,
            "analytics_update": {
                "xp_delta": meta.get("xp_earned", 0),
                "source": req.action_type.split("_")[0].lower(),
                "date": datetime.now().date().isoformat(),
            }
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Action complete error: {e}")
        raise HTTPException(status_code=500, detail=f"Action processing failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════
# GAMIFICATION ENGINE ROUTES
# ═══════════════════════════════════════════════════════════════

@app.post("/api/gamification/process")
async def process_gamification_event(
    req: GamificationEventRequest,
    authorization: str = Header(None)
):
    """
    Process a gamification event and return updated XP / level / badges.
    Automatically persists changes to the parents table.
    """
    try:
        if not GAM_ENGINE_AVAILABLE:
            raise HTTPException(status_code=503, detail="Gamification engine not available")

        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != req.uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Fetch current student record
        parents = await supabase_query("parents", filters={"uid": req.uid}, token=user_token)
        if not parents:
            raise HTTPException(status_code=404, detail="Student profile not found")

        student_record = parents[0]

        # Run engine
        update_dict = gam_process_event(
            event_type=req.event_type,
            student_record=student_record,
            event_payload=req.payload or {}
        )

        meta = update_dict.pop("_meta", {})

        # Persist to DB (exclude internal _meta)
        persist_fields = {k: v for k, v in update_dict.items() if not k.startswith("_")}
        if persist_fields:
            headers_patch = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {user_token}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            url = f"{SUPABASE_URL}/rest/v1/parents?uid=eq.{req.uid}"
            async with httpx.AsyncClient() as client:
                await client.patch(url, headers=headers_patch, json=persist_fields)

        # Also record in xp_events table if it exists (best-effort, non-fatal)
        try:
            xp_event_record = {
                "uid": req.uid,
                "event_type": req.event_type,
                "xp_earned": meta.get("xp_earned", 0),
                "source": req.event_type.split("_")[0],  # homework | game | attendance
                "date": datetime.now().date().isoformat(),
                "created_at": datetime.now().isoformat()
            }
            await supabase_query(
                "xp_events",
                method="POST",
                data=xp_event_record,
                token=user_token
            )
        except Exception:
            pass  # Table may not exist yet — non-fatal

        # Re-fetch fresh record
        updated_parents = await supabase_query("parents", filters={"uid": req.uid}, token=user_token)
        fresh = updated_parents[0] if updated_parents else {**student_record, **persist_fields}

        return JSONResponse({
            "success": True,
            "xp_earned": meta.get("xp_earned", 0),
            "total_xp": meta.get("total_xp", fresh.get("reward_points", 0)),
            "level": meta.get("new_level", fresh.get("current_level", 1)),
            "level_up": meta.get("level_up", False),
            "new_badges": meta.get("new_badges", []),
            "streak": fresh.get("streak", 0),
            "streak_milestone": meta.get("streak_milestone", False),
            "profile": fresh
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Gamification process error: {e}")
        raise HTTPException(status_code=500, detail=f"Gamification processing failed: {str(e)}")


@app.get("/api/gamification/status/{uid}")
async def get_gamification_status(
    uid: str,
    authorization: str = Header(None)
):
    """Return current XP / level / badge / streak status for a student."""
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        parents = await supabase_query("parents", filters={"uid": uid}, token=user_token)
        if not parents:
            raise HTTPException(status_code=404, detail="Student profile not found")

        p = parents[0]
        total_xp = int(p.get("reward_points", 0))

        return JSONResponse({
            "uid": uid,
            "total_xp": total_xp,
            "level": int(p.get("current_level", calculate_level(total_xp))),
            "current_level_xp": total_xp % 100,
            "xp_to_next_level": 100 - (total_xp % 100),
            "streak": int(p.get("streak", 0)),
            "badges": p.get("badges", []),
            "achievement_stars": int(p.get("achievement_stars", 0)),
            "last_active_date": p.get("last_active_date")
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Gamification status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# ANALYTICS ROUTES
# ═══════════════════════════════════════════════════════════════

@app.get("/api/analytics/performance/{uid}")
async def get_performance_analytics(
    uid: str,
    authorization: str = Header(None)
):
    """
    Return analytics data for Recharts components:
      - XP timeline (LineChart)
      - Source breakdown (BarChart / PieChart)
      - Weekly progress (AreaChart)
      - Current summary stats
    """
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Fetch student profile for current stats
        parents = await supabase_query("parents", filters={"uid": uid}, token=user_token)
        p = parents[0] if parents else {}
        total_xp = int(p.get("reward_points", 0))

        # Fetch XP event history (best-effort — table may not exist)
        xp_history: list[dict] = []
        try:
            raw_events = await supabase_query(
                "xp_events",
                filters={"uid": uid},
                token=user_token
            )
            xp_history = raw_events if raw_events else []
        except Exception:
            pass  # Table doesn't exist yet

        # Generate synthetic demo data if no real history
        if not xp_history and total_xp > 0:
            from datetime import date, timedelta
            today = date.today()
            # Spread XP across last 14 days
            daily_xp = max(1, total_xp // 14)
            for i in range(14):
                d = today - timedelta(days=13 - i)
                if i % 3 != 0:  # skip some days for realism
                    source = ["homework", "games", "attendance"][i % 3]
                    xp_history.append({
                        "date": d.isoformat(),
                        "xp_earned": daily_xp + (i % 5),
                        "source": source
                    })

        # Build chart-ready data using engine helpers
        if GAM_ENGINE_AVAILABLE:
            xp_timeline = build_xp_timeline(xp_history)
            source_breakdown = build_source_breakdown(xp_history)
            weekly_progress = build_weekly_progress(xp_history)
        else:
            xp_timeline = []
            source_breakdown = []
            weekly_progress = []

        # Subject scores (from alphabet game analytics if available)
        subject_scores: dict = {}
        try:
            alphabet_stats = await supabase_query(
                "alphabet_game_stats",
                filters={"uid": uid},
                token=user_token
            )
            if alphabet_stats:
                latest = alphabet_stats[-1]
                subject_scores["Language Arts"] = float(latest.get("accuracy", 0))
        except Exception:
            pass

        hw_completed = int(p.get("homework_completed", 0))
        hw_total = max(int(p.get("homework_total", 1)), 1)
        games_played = int(p.get("games_played", 0))

        current_stats = {
            "total_xp": total_xp,
            "level": int(p.get("current_level", 1)),
            "streak": int(p.get("streak", 0)),
            "homework_rate": round((hw_completed / hw_total) * 100, 1),
            "games_played": games_played,
            "badges_count": len(p.get("badges") or []),
        }

        return JSONResponse({
            "uid": uid,
            "xp_timeline": xp_timeline,
            "source_breakdown": source_breakdown,
            "weekly_progress": weekly_progress,
            "subject_scores": subject_scores,
            "current_stats": current_stats
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# AI INSIGHTS ROUTES
# ═══════════════════════════════════════════════════════════════

@app.get("/api/insights/{uid}")
async def get_ai_insights(
    uid: str,
    authorization: str = Header(None)
):
    """
    Generate and return AI performance insights for the student.
    Rule-based analysis — no external AI model required.
    """
    try:
        if not GAM_ENGINE_AVAILABLE:
            # Fallback static insight
            return JSONResponse({
                "summary": "Keep learning and earning XP!",
                "weak_area": None,
                "recommendation": "Complete your homework to earn XP.",
                "motivation": "Every step counts! 🌟",
                "score": 50.0,
                "trend": "stable",
                "badge_hint": "Earn more XP to unlock badges!"
            })

        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Build student data snapshot
        parents = await supabase_query("parents", filters={"uid": uid}, token=user_token)
        p = parents[0] if parents else {}

        hw_completed = int(p.get("homework_completed", 0))
        hw_total_raw = int(p.get("homework_total", 0))

        # Try fetching live homework count for accuracy
        try:
            student_class = p.get("class_section", "1-A")
            hw_list = await supabase_query(
                "homework",
                filters={"class_section": student_class},
                token=SUPABASE_KEY
            )
            hw_total_live = len(hw_list) if hw_list else hw_total_raw
            subs = await supabase_query(
                "homework_submissions",
                filters={"student_uid": uid},
                token=user_token
            )
            hw_done_live = len(subs) if subs else hw_completed
        except Exception:
            hw_total_live = hw_total_raw or 10
            hw_done_live = hw_completed

        # Game accuracy from alphabet game stats
        game_accuracy = 0.0
        try:
            stats = await supabase_query(
                "alphabet_game_stats",
                filters={"uid": uid},
                token=user_token
            )
            if stats:
                scores = [float(s.get("accuracy", 0)) for s in stats if s.get("accuracy")]
                game_accuracy = round(sum(scores) / len(scores), 1) if scores else 0.0
        except Exception:
            pass

        student_data = {
            "reward_points": int(p.get("reward_points", 0)),
            "streak": int(p.get("streak", 0)),
            "homework_completed": hw_done_live,
            "homework_total": hw_total_live,
            "game_accuracy": game_accuracy,
            "games_played": int(p.get("games_played", 0)),
            "current_level": int(p.get("current_level", 1)),
            "subject_scores": {},
        }

        insights = generate_insights(student_data)
        return JSONResponse(insights)

    except HTTPException:
        raise
    except Exception as e:
        print(f"AI insights error: {e}")
        return JSONResponse({
            "summary": "Keep learning and earning XP!",
            "weak_area": None,
            "recommendation": "Complete your homework to earn bonus XP.",
            "motivation": "Every step counts! 🌟",
            "score": 50.0,
            "trend": "stable",
            "badge_hint": None
        })


# ═══════════════════════════════════════════════════════════════════
# AI LEARNING ASSISTANT
# ═══════════════════════════════════════════════════════════════════

def _ai_classify(message: str) -> str:
    """Classify the intent of a student message."""
    msg = message.lower().strip()

    math_keywords = ['+', '-', '*', '×', '÷', 'multiply', 'divide', 'plus', 'minus', 'times', 'added', 'subtracted']
    if any(k in msg for k in math_keywords) and any(c.isdigit() for c in msg):
        return 'math'
    if any(w in msg for w in ['what is', 'calculate', 'solve', 'answer', 'equals', 'how much']):
        if any(c.isdigit() for c in msg):
            return 'math'
    if any(w in msg for w in ['spell', 'spelling', 'how do you spell', 'letters in', 'how to write']):
        return 'spelling'
    if any(w in msg for w in ['how am i', 'my progress', 'my xp', 'my level', 'how i am', 'doing', 'performance']):
        return 'progress'
    if any(w in msg for w in ['streak', 'consecutive', 'days in a row']):
        return 'streak'
    if any(w in msg for w in ['badge', 'reward', 'trophy', 'achievement', 'medal']):
        return 'rewards'
    if any(w in msg for w in ['homework', 'assignment', 'task', 'due', 'submitted', 'pending']):
        return 'homework'
    if any(w in msg for w in ['game', 'play', 'fun', 'which game', 'what game']):
        return 'games'
    if any(w in msg for w in ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'namaste', 'hola']):
        return 'greeting'
    if any(w in msg for w in ['tired', 'bored', "can't", 'cant', 'hard', 'difficult', 'struggling', 'give up']):
        return 'motivation'
    return 'general'


def _try_eval_math(expression: str):
    """Safely evaluate a simple math expression from natural language."""
    import re
    # Replace word operators
    expr = expression.lower()
    expr = expr.replace('×', '*').replace('÷', '/').replace('plus', '+').replace('minus', '-') \
               .replace('times', '*').replace('multiplied by', '*').replace('divided by', '/')
    pattern = r'(\d+\.?\d*)\s*([+\-*/])\s*(\d+\.?\d*)'
    m = re.search(pattern, expr)
    if not m:
        return None
    a, op, b = float(m.group(1)), m.group(2), float(m.group(3))
    try:
        if op == '+':   result = a + b
        elif op == '-': result = a - b
        elif op == '*': result = a * b
        elif op == '/':
            if b == 0: return "zero_div"
            result = a / b
        else:
            return None
        return int(result) if result == int(result) else round(result, 2)
    except Exception:
        return None


def _build_ai_reply(intent: str, message: str, ctx: dict):
    """Build a context-aware reply and follow-up suggestions."""
    name     = (ctx.get('name') or 'Student').split()[0]
    level    = ctx.get('level', 1)
    xp       = ctx.get('xp', 0)
    streak   = ctx.get('streak', 0)
    hw_done  = ctx.get('hw_done', 0)
    hw_total = ctx.get('hw_total', 0)
    badges   = ctx.get('badges', [])
    badge_n  = len(badges) if isinstance(badges, list) else 0
    xp_to_next = 100 - (xp % 100)

    if intent == 'greeting':
        reply = (
            f"Hey {name}! 👋 Great to see you!\n\n"
            f"You're currently **Level {level}** with **{xp} XP** and a "
            f"**{streak}-day** learning streak. What would you like to explore today?"
        )
        suggestions = ["Show my progress", "Help me with math", "Which game should I play?", "Homework tips"]

    elif intent == 'math':
        result = _try_eval_math(message)
        if result == "zero_div":
            reply = "Oops! 😄 You can't divide by zero — that's one of math's biggest rules!\n\nTry a different number for the divisor!"
        elif result is not None:
            reply = (
                f"🎉 The answer is **{result}**!\n\n"
                "Nice work asking — practice makes perfect! Want to try another one? 🧮"
            )
        else:
            reply = (
                "Let me help you with math! 🧮\n\n"
                "**Quick tips:**\n"
                "➕ Addition: count forwards on a number line\n"
                "➖ Subtraction: count backwards\n"
                "✖️ Multiplication: repeated addition  (3×4 = 3+3+3+3)\n\n"
                "Type a problem like **5 + 3** or **12 - 7** and I'll solve it instantly!"
            )
        suggestions = ["Solve 7 × 8", "What is 100 ÷ 5?", "Help with subtraction", "Play Math Quest game"]

    elif intent == 'spelling':
        reply = (
            "📖 Great spelling question!\n\n"
            "**My spelling tips:**\n"
            "1️⃣ Break the word into syllables\n"
            "2️⃣ Sound each part out loud\n"
            "3️⃣ Write it 3 times to lock it in memory\n"
            "4️⃣ Use it in a sentence!\n\n"
            "🐝 Play **Spelling Bee** in the Games section to practice spelling with XP rewards!"
        )
        suggestions = ["Play Spelling Bee", "What are easy 3-letter words?", "Help me with reading", "Show game options"]

    elif intent == 'progress':
        bar_full  = min(20, int(((xp % 100) / 100) * 20))
        bar_empty = 20 - bar_full
        xp_bar    = "▓" * bar_full + "░" * bar_empty
        mood      = "🌟 Absolutely amazing!" if streak >= 7 else ("🔥 Great work!" if streak >= 3 else "💪 Keep going!")
        reply = (
            f"📊 **Your Learning Report, {name}!**\n\n"
            f"⭐ Level: **{level}**\n"
            f"⚡ XP: **{xp}** ─ {xp_to_next} more to Level {level + 1}!\n"
            f"   [{xp_bar}] {xp % 100}/100\n"
            f"🔥 Streak: **{streak} days**\n"
            f"📚 Homework: **{hw_done}/{hw_total}** done\n"
            f"🏆 Badges: **{badge_n}** earned\n\n"
            f"{mood}"
        )
        suggestions = ["How do I earn more XP?", "What badges can I unlock?", "Play a game for XP", "Homework status"]

    elif intent == 'streak':
        if streak >= 7:
            reply = f"🔥 **{streak}-day streak!** You are absolutely on fire, {name}! Keep logging in every day to keep this incredible streak going! You're earning bonus XP for every milestone! 🏆"
        elif streak >= 3:
            reply = f"🔥 **{streak}-day streak!** Nice work, {name}! You're {7 - streak} day(s) away from a **7-day milestone** with bonus XP rewards!"
        else:
            reply = (
                f"Your current streak is **{streak} day(s)**, {name}.\n\n"
                "Log in and complete at least one activity each day to build your streak!\n"
                "7-day streak = **Bonus XP + special badge** 🏅"
            )
        suggestions = ["What activities count for my streak?", "Show my progress", "Play a game now", "Complete homework"]

    elif intent == 'rewards':
        if badge_n > 0:
            reply = (
                f"🏆 You've earned **{badge_n} badge(s)** so far — incredible work, {name}!\n\n"
                "Keep completing homework, playing games, and building your streak to unlock even more! "
                "Visit the **Rewards** page to see your full collection. 🌟"
            )
        else:
            reply = (
                "🏆 You haven't unlocked any badges yet — but they're waiting for you!\n\n"
                "**How to earn badges:**\n"
                "✅ Complete homework assignments\n"
                "🎮 Play and win learning games\n"
                "🔥 Maintain a 7-day streak\n"
                "⚡ Reach XP milestones\n\n"
                "Go check the **Rewards** page to see what's available! 🎯"
            )
        suggestions = ["How do I earn more XP?", "Show my streak", "Play a game", "Check my progress"]

    elif intent == 'homework':
        pending = max(0, hw_total - hw_done)
        if pending <= 0 and hw_total > 0:
            reply = f"📚 **All done!** You've completed all **{hw_total}** homework assignment(s), {name}! You are an absolute superstar! ⭐\n\nNow play some games and earn even more XP! 🎮"
        elif hw_total == 0:
            reply = f"📚 No homework assigned yet, {name}! Check back later or ask your teacher.\n\nMeanwhile, play some games to earn XP! 🎮"
        else:
            reply = (
                f"📚 You have **{pending} pending** homework assignment(s) out of {hw_total} total.\n\n"
                "**Tips to finish faster:**\n"
                "✏️ Start with the easiest question first\n"
                "⏱ Set a 15-minute timer — beat the clock!\n"
                "💡 Each correct answer earns XP!\n\n"
                f"You've already completed {hw_done} — keep going! 💪"
            )
        suggestions = ["Earn XP from homework", "Show my progress", "Take a brain break with a game", "Math tips"]

    elif intent == 'games':
        reply = (
            "🎮 **Recommended games for you:**\n\n"
            "🃏 **Memory Flip** — Match pairs (15 XP) ← highest XP!\n"
            "📝 **Word Builder** — Build words (12 XP)\n"
            "➕ **Math Quest** — Solve math (10 XP)\n"
            "🐝 **Spelling Bee** — Spell words (10 XP)\n"
            "🔤 **Alphabet Race** — Identify letters (8 XP)\n"
            "⭐ **Counting Stars** — Count objects (6 XP)\n\n"
            f"You're **Level {level}** — play **Memory Flip** to level up fastest! 🏆"
        )
        suggestions = ["How do I level up?", "What's Memory Flip?", "Show my XP", "Homework help"]

    elif intent == 'motivation':
        reply = (
            f"Hey {name}, I believe in you! 💪\n\n"
            f"You're already **Level {level}** — that took real effort and dedication!\n\n"
            "When things feel hard:\n"
            "🎮 **Play a quick game** to refresh your mind\n"
            "⏱ **Try for just 5 minutes** — you'll often keep going\n"
            "📝 **Break it into small steps** — one question at a time\n\n"
            "You've got this. Every expert was once a beginner! 🌟"
        )
        suggestions = ["Show my achievements", "Play a quick game", "Math tips", "Check my progress"]

    else:  # general
        reply = (
            f"Hi {name}! 🤖 I'm your AI Learning Assistant.\n\n"
            "**I can help you with:**\n"
            "🧮 Math problems — just type the equation!\n"
            "📖 Spelling tips and word help\n"
            "📊 Your XP, level, streak & homework progress\n"
            "🎮 Game recommendations for maximum XP\n"
            "💪 Motivation when things get tough\n\n"
            "What would you like to explore?"
        )
        suggestions = ["Help me with math", "Check my progress", "Which game gives most XP?", "Homework tips"]

    return reply, suggestions


@app.post("/api/assistant/chat")
async def assistant_chat(
    body: dict,
    authorization: str = Header(None)
):
    """Context-aware AI Learning Assistant — personalized responses using student data."""
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        uid       = body.get('uid') or user_data.get('id')
        message   = (body.get('message') or '').strip()

        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        if len(message) > 1000:
            raise HTTPException(status_code=400, detail="Message too long")

        # Fetch student context (best-effort — never fail the chat for this)
        student_ctx: dict = {}
        try:
            parents = await supabase_query("parents", filters={"uid": uid}, token=user_token)
            if parents:
                p = parents[0]
                raw_xp = int(p.get("reward_points", 0))
                student_ctx = {
                    "name":      p.get("student_name", "Student"),
                    "xp":        raw_xp,
                    "level":     min(raw_xp // 100 + 1, 50),
                    "streak":    int(p.get("streak", 0)),
                    "hw_done":   int(p.get("homework_completed", 0)),
                    "hw_total":  max(int(p.get("homework_total", 1)), 1),
                    "badges":    p.get("badges") or [],
                }
        except Exception:
            student_ctx = {"name": "Student", "xp": 0, "level": 1, "streak": 0,
                           "hw_done": 0, "hw_total": 1, "badges": []}

        intent = _ai_classify(message)
        reply, suggestions = _build_ai_reply(intent, message, student_ctx)

        # Best-effort: persist to chat_messages table
        try:
            now_iso = datetime.now().isoformat()
            await supabase_query("chat_messages", method="POST",
                data={"uid": uid, "role": "user",      "message": message, "timestamp": now_iso},
                token=user_token)
            await supabase_query("chat_messages", method="POST",
                data={"uid": uid, "role": "assistant", "message": reply,   "timestamp": now_iso},
                token=user_token)
        except Exception:
            pass

        return JSONResponse({
            "reply":       reply,
            "suggestions": suggestions,
            "timestamp":   datetime.now().isoformat(),
            "intent":      intent,
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Assistant chat error: {e}")
        raise HTTPException(status_code=500, detail="Assistant temporarily unavailable")


@app.get("/api/assistant/history/{uid}")
async def assistant_history(uid: str, authorization: str = Header(None)):
    """Load last 40 chat messages for a student (20 exchanges)."""
    try:
        user_token = None
        if authorization and authorization.startswith('Bearer '):
            user_token = authorization.split('Bearer ')[1]

        user_data = await verify_supabase_token(authorization)
        if user_data.get("id") != uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        try:
            msgs = await supabase_query("chat_messages", filters={"uid": uid}, token=user_token)
            msgs = sorted(msgs or [], key=lambda x: x.get("timestamp", ""))[-40:]
        except Exception:
            msgs = []

        return JSONResponse({"messages": msgs})

    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat history error: {e}")
        return JSONResponse({"messages": []})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
