from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
ORGANIZATION_ID = "10000000-0000-0000-0000-000000000001"

DOCUMENTS = (
    {
        "resource_id": "13000000-0000-0000-0000-000000000003",
        "version_id": "14000000-0000-0000-0000-000000000003",
        "filename": "adult-bls-algorithm.pdf",
        "title": "Adult BLS Algorithm",
        "label": "Fictional protected-document fixture",
    },
    {
        "resource_id": "13000000-0000-0000-0000-000000000007",
        "version_id": "14000000-0000-0000-0000-000000000007",
        "filename": "adult-choking-reference.pdf",
        "title": "Adult Choking Reference",
        "label": "Fictional protected-document fixture",
    },
)


def draw_document(document: dict[str, str]) -> Path:
    output = (
        ROOT
        / "supabase"
        / "fixtures"
        / "course-resources"
        / ORGANIZATION_ID
        / document["resource_id"]
        / document["version_id"]
        / document["filename"]
    )
    output.parent.mkdir(parents=True, exist_ok=True)

    page_width, page_height = A4
    pdf = canvas.Canvas(
        str(output),
        pagesize=A4,
        invariant=1,
        pageCompression=1,
    )
    pdf.setTitle(f"DEMO - {document['title']}")
    pdf.setAuthor("BLS Learning PWA development fixtures")
    pdf.setSubject("Fictional interface-test content; not clinical guidance")

    navy = HexColor("#12304A")
    teal = HexColor("#2F7D78")
    warm = HexColor("#F6F3EC")
    muted = HexColor("#5C6873")
    border = HexColor("#D8DED9")

    pdf.setFillColor(warm)
    pdf.rect(0, 0, page_width, page_height, stroke=0, fill=1)

    pdf.setFillColor(navy)
    pdf.rect(0, page_height - 118, page_width, 118, stroke=0, fill=1)
    pdf.setFillColor(HexColor("#FFFFFF"))
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(48, page_height - 48, "BLS LEARNING - DEVELOPMENT FIXTURE")
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(48, page_height - 82, document["title"])
    pdf.setFont("Helvetica", 10)
    pdf.drawString(48, page_height - 101, document["label"])

    pdf.saveState()
    pdf.setFillColor(HexColor("#DDE7E3"))
    pdf.setFont("Helvetica-Bold", 72)
    pdf.translate(page_width / 2, page_height / 2)
    pdf.rotate(32)
    pdf.drawCentredString(0, 0, "DEMO ONLY")
    pdf.restoreState()

    y = page_height - 176
    pdf.setFillColor(HexColor("#FFFFFF"))
    pdf.setStrokeColor(border)
    pdf.roundRect(48, y - 132, page_width - 96, 132, 10, stroke=1, fill=1)
    pdf.setFillColor(teal)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(68, y - 28, "NOT CLINICAL GUIDANCE")
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(68, y - 56, "This file exists only to test secure delivery.")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 11)
    pdf.drawString(68, y - 82, "It intentionally contains no treatment algorithm, assessment criteria,")
    pdf.drawString(68, y - 100, "or clinical instructions. Do not use it for education or patient care.")

    y -= 178
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(48, y, "Fixture purpose")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 11)
    lines = (
        "- Confirm that private objects are not publicly accessible.",
        "- Confirm that authorized users receive a short-lived signed URL.",
        "- Confirm that access authorization and issuance are audited.",
        "- Confirm that protected responses are not stored in application caches.",
    )
    for offset, line in enumerate(lines, start=1):
        pdf.drawString(56, y - 26 * offset, line)

    y -= 142
    pdf.setFillColor(HexColor("#FFFFFF"))
    pdf.setStrokeColor(border)
    pdf.roundRect(48, y - 104, page_width - 96, 104, 10, stroke=1, fill=1)
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(68, y - 25, "Immutable fixture identifiers")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawString(68, y - 48, f"Resource: {document['resource_id']}")
    pdf.drawString(68, y - 67, f"Version:  {document['version_id']}")
    pdf.drawString(68, y - 86, f"Path:     {ORGANIZATION_ID}/.../{document['filename']}")

    pdf.setStrokeColor(teal)
    pdf.line(48, 58, page_width - 48, 58)
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(48, 40, "BLS Learning PWA - fictional development data")
    pdf.drawRightString(page_width - 48, 40, "Page 1 of 1")

    pdf.showPage()
    pdf.save()
    return output


if __name__ == "__main__":
    for fixture in DOCUMENTS:
        print(draw_document(fixture))
