import zipfile
import re
import os

BASE = os.path.dirname(os.path.abspath(__file__))


def extract_docx(path, out_txt):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
        media = [n for n in z.namelist() if n.startswith("word/media/")]
        media_dir = os.path.join(BASE, "docx_media")
        os.makedirs(media_dir, exist_ok=True)
        for m in media:
            name = os.path.basename(m)
            with z.open(m) as src, open(os.path.join(media_dir, name), "wb") as dst:
                dst.write(src.read())
    text = re.sub(r"</w:p>", "\n", xml)
    text = re.sub(r"<[^>]+>", "", text)
    for a, b in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"')]:
        text = text.replace(a, b)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    with open(out_txt, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return len(lines), len(media)


def extract_pptx(path, out_txt):
    slides = []
    with zipfile.ZipFile(path) as z:
        slide_files = sorted(
            [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml", n)],
            key=lambda x: int(re.search(r"slide(\d+)", x).group(1)),
        )
        for sf in slide_files:
            xml = z.read(sf).decode("utf-8")
            texts = re.findall(r"<a:t[^>]*>([^<]*)</a:t>", xml)
            slides.append(texts)
        media = [n for n in z.namelist() if n.startswith("ppt/media/")]
        media_dir = os.path.join(BASE, "pptx_media")
        os.makedirs(media_dir, exist_ok=True)
        for m in media:
            name = os.path.basename(m)
            with z.open(m) as src, open(os.path.join(media_dir, name), "wb") as dst:
                dst.write(src.read())
    with open(out_txt, "w", encoding="utf-8") as f:
        for i, s in enumerate(slides, 1):
            f.write(f"=== SLIDE {i} ===\n")
            f.write("\n".join(s) if s else "(no text)")
            f.write("\n\n")
    return len(slides), len(media)


if __name__ == "__main__":
    root = os.path.dirname(BASE)
    docx = os.path.join(root, "..", "Online_Popup.docx")
    pptx = os.path.join(root, "..", "온라인 팝업스토어 플랫폼.pptx")
    docx = os.path.normpath(docx)
    pptx = os.path.normpath(pptx)

    n1, m1 = extract_docx(docx, os.path.join(BASE, "docx_text.txt"))
    n2, m2 = extract_pptx(pptx, os.path.join(BASE, "pptx_text.txt"))
    print("docx lines", n1, "media", m1)
    print("pptx slides", n2, "media", m2)
