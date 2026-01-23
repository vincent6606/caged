import os
from pypdf import PdfReader

tutorial_dir = "/Users/zhitingchen/Desktop/caged/alphatab-tutorial"

def extract_pdf(filepath):
    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error extracting {filepath}: {e}"

def run():
    print(f"Scanning directory: {tutorial_dir}")
    files = sorted([f for f in os.listdir(tutorial_dir) if f.endswith(".pdf")])
    
    if not files:
        print("No PDF files found.")
        return

    for filename in files:
        print(f"\n{'='*50}")
        print(f"FILE: {filename}")
        print(f"{'='*50}\n")
        path = os.path.join(tutorial_dir, filename)
        content = extract_pdf(path)
        print(content)
        print("\n\n")

if __name__ == "__main__":
    run()
