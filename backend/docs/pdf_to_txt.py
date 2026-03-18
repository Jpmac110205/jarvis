import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent


def pdf_to_txt(pdf_path: str) -> str:
    try:
        import pdfplumber
    except ImportError:
        print("Missing dependency. Run: pip install pdfplumber")
        sys.exit(1)

    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        print(f"Error: File not found — {pdf_path}")
        sys.exit(1)
    if pdf_path.suffix.lower() != ".pdf":
        print(f"Error: Expected a .pdf file, got '{pdf_path.suffix}'")
        sys.exit(1)

    output_path = SCRIPT_DIR / pdf_path.with_suffix(".txt").name

    print(f"Converting: {pdf_path} → {output_path}")

    extracted_pages = []

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages, start=1):
            print(f"  Processing page {i}/{total}...", end="\r")
            text = page.extract_text() or ""
            extracted_pages.append(f"--- Page {i} ---\n{text}")

    print()

    full_text = "\n\n".join(extracted_pages)
    output_path.write_text(full_text, encoding="utf-8")

    print(f"Done. Saved to: {output_path}")
    print(f"Total pages: {total} | Characters extracted: {len(full_text):,}")

    return str(output_path)