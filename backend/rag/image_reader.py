"""
image_reader.py — Extract text from uploaded images using Groq Vision LLM.
Falls back to pytesseract OCR if Groq vision is unavailable.
"""
import os
import base64
from io import BytesIO
from typing import List
from dotenv import load_dotenv
from groq import Groq
from PIL import Image, ImageOps, ImageFilter

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
load_dotenv()

_groq = Groq(api_key=os.getenv("GROQ_API_KEY"))
_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct").strip()


def _vision_models_to_try() -> List[str]:
    """Primary vision model + optional comma-separated fallbacks from env."""
    models: List[str] = []
    for item in [_VISION_MODEL, os.getenv("GROQ_VISION_MODEL_FALLBACKS", "")]:
        for raw in (item or "").split(","):
            model = raw.strip()
            if model and model not in models:
                models.append(model)
    return models


def _image_to_base64(image_bytes: bytes, mime_type: str = "image/png") -> str:
    """Convert raw image bytes to a data-URI string for Groq Vision."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{b64}"


def _resize_if_needed(img: Image.Image, max_side: int = 1280) -> Image.Image:
    """Down-scale large images to avoid hitting API size limits."""
    w, h = img.size
    if max(w, h) <= max_side:
        return img
    ratio = max_side / max(w, h)
    return img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)


def _is_empty_like_vision_output(text: str) -> bool:
    content = (text or "").strip().lower()
    if not content:
        return True
    empty_markers = [
        "no text visible",
        "no visible text",
        "unable to read",
        "cannot read",
        "can't read",
        "no readable text",
    ]
    return any(marker in content for marker in empty_markers)


def _extract_with_groq_vision(data_uri: str) -> str:
    """Try configured Groq multimodal models and return extracted text."""
    last_error = None
    for model_name in _vision_models_to_try():
        try:
            response = _groq.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Extract ALL readable text from this image exactly as written. "
                                    "Preserve numbers, equations, options, and labels. "
                                    "If it is a diagram/question paper, include the full question text and options. "
                                    "Return only extracted content."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": data_uri},
                            },
                        ],
                    }
                ],
                temperature=0,
                max_tokens=1400,
            )
            text = (response.choices[0].message.content or "").strip()
            if not _is_empty_like_vision_output(text):
                return text
        except Exception as e:
            last_error = e
            print(f"[image_reader] Vision model failed ({model_name}): {e}")
            continue

    if last_error is not None:
        raise last_error
    return ""


def _preprocess_for_ocr(img: Image.Image) -> Image.Image:
    """Simple preprocessing to improve OCR readability."""
    gray = ImageOps.grayscale(img)
    sharpened = gray.filter(ImageFilter.SHARPEN)
    # Binary threshold to improve contrast for scanned pages.
    return sharpened.point(lambda p: 255 if p > 165 else 0)


def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/png") -> str:
    """
    Primary: Groq Vision LLM (llama-3.2-11b-vision-preview).
    Fallback: pytesseract OCR.
    Returns the extracted text string.
    """
    # ── Try Groq Vision first ───────────────────────────────────────
    try:
        # Resize to keep within API limits
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        img = _resize_if_needed(img)

        buf = BytesIO()
        img.save(buf, format="PNG")
        data_uri = _image_to_base64(buf.getvalue(), "image/png")

        text = _extract_with_groq_vision(data_uri)
        if text:
            return text
    except Exception as e:
        print(f"[image_reader] Groq Vision failed, trying OCR fallback: {e}")

    # ── Fallback: pytesseract OCR ───────────────────────────────────
    try:
        import pytesseract
        tesseract_cmd = (os.getenv("TESSERACT_CMD") or "").strip()
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        processed = _preprocess_for_ocr(img)
        lang = os.getenv("OCR_LANG", "eng")
        text = pytesseract.image_to_string(processed, lang=lang)
        return text.strip()
    except Exception as ocr_err:
        print(f"[image_reader] OCR fallback also failed: {ocr_err}")
        return ""
