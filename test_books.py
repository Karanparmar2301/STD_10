import sys
sys.path.insert(0, r"c:\class 10\student dashboard")
import main
import urllib.parse

def test():
    subject = "std_10_mathematics"
    subject = urllib.parse.unquote(subject)
    folder = main.os.path.join(main._UPLOADS_DIR, subject)
    print("Folder:", folder)
    print("Exists:", main.os.path.isdir(folder))
    
    files = [f for f in main.os.listdir(folder)]
    print("All files:", files)
    
    pdf_files = [f for f in files if f.lower().endswith(".pdf")]
    print("PDF files:", pdf_files)
    
    try:
        sort_key_fn = main._sort_key_math if subject == "std_9_Mathematics" else main._sort_key
        sorted_files = sorted(pdf_files, key=sort_key_fn)
        print("Sorted:", sorted_files)
    except Exception as e:
        print("Error sorting:", e)

test()