# Photo download policy (2026-09-23)

The owner chose **web-size downloads only**. The nine currently published photo
pages offer each photograph's existing 1200px WebP export. The link uses the
same image path as the page's display-size record and a stable filename:
`kris-<photo-id>-web.webp`.

The link is shown only when the photo has a safe ID and a same-site path of the
form `images/<category>/<name>-1200.webp`. No 1800px display image, original
JPEG, or arbitrary external URL is offered as a download. A future Storage
image URL needs a separately verified export and download behavior before a
button is shown. A missing photo never shows a download link.

The browser's `download` attribute requests the suggested filename for the
same-origin WebP. Desktop and 390px mobile browser checks downloaded all nine
files and compared their SHA-256 hashes with the checked-in 1200px WebPs.

**Current limit:** the GitHub repository is public and still contains the
original JPEGs and full-size WebPs by the owner's explicit decision. Hiding
them from the website's download button does not make those repository files
private or prevent someone from saving displayed images. Do not mark original
protection complete until the public copies are deliberately retired after a
verified external archive, which the owner has chosen not to do now.

Watermarking was not requested and no watermark is applied. The download policy
can be reviewed again when Storage is connected or new photographs are added.
