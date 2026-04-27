# Engine Matrix

| Engine | Installed Probe | Adapter Implemented | Runnable When Installed | Current Use |
| --- | --- | --- | --- | --- |
| `qpdf` | `qpdf --version` | Yes | Yes | merge, split, rotate, unlock, protect |
| `libreoffice` | `soffice --version` or `libreoffice --version` | No | No | Future office conversion |
| `render` | `mutool -v` or `pdftoppm -v` | No | No | Future PDF/image rendering |
| `ocrmypdf` | `ocrmypdf --version` | No | No | Future OCR |
| `html-local` | Built-in placeholder | No | No | Future local HTML rendering |
| `watermark-pipeline` | Built-in placeholder | No | No | Future overlays/signing/redaction |
| `ghostscript` | `gs --version` or Windows Ghostscript commands | No | No | Future compression/PDF-A/repair |

Engine status is intentionally split:

- `installed`: dependency probe succeeded or built-in engine exists
- `implemented`: this app has an adapter for it
- `runnable`: installed and implemented
