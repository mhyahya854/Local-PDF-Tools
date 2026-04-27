# Support Matrix

PDF Powerhouse is a qpdf-first desktop application for the current release.

Browser mode is preview-only. It can render the UI and validate local form state, but it does not execute file-processing jobs and never returns real outputs.

| Tool ID | Engine | Implemented | Desktop Only | Browser Preview | Inputs | Supported Options | Output Strategy | Release Status | Known Limits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `merge-pdf` | `qpdf` | Yes | Yes | Yes | `.pdf`, minimum 2 files | `reverse` | Single merged PDF | Beta | Source bookmarks are not preserved as a user option in this release. |
| `split-pdf` | `qpdf` | Yes | Yes | Yes | `.pdf`, exactly 1 file | `mode`, `ranges`, `everyNPages` | One PDF per range or page chunk | Beta | Page ranges are validated syntactically before execution; page existence is checked by qpdf. |
| `rotate-pdf` | `qpdf` | Yes | Yes | Yes | `.pdf`, one or more files | `angle` | One output PDF per input | Beta | Rotation applies to all pages. |
| `unlock-pdf` | `qpdf` | Yes | Yes | No | `.pdf`, one or more files | `password` | One output PDF per input | Beta | Requires the correct known password when the source is encrypted. |
| `protect-pdf` | `qpdf` | Yes | Yes | No | `.pdf`, one or more files | `userPassword`, `ownerPassword`, `allowPrint`, `allowCopy` | One output PDF per input | Beta | User and owner passwords are both required and must differ. |
| Non-qpdf catalog tools | various | No | Yes | Preview metadata only | Varies | None exposed | None | Hidden from active tool browse surface | Adapter implementation and tests are required before exposure. |

## Release Rule

A tool can appear in the active tool browser only when all are true:

- backend capability descriptor exists
- backend execution is implemented
- engine probe can report installed, implemented, and runnable separately
- input and option validation exist in backend
- browser mode cannot report execution success
- tests cover success and failure contracts
