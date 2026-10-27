# GLP-1 Protocol Optimizer

Upload a GLP-1 clinical trial protocol (PDF or text) and get inline, Grammarly-style suggestions on how to strengthen it. Every suggestion is grounded in completed Phase 3 GLP-1 trials with posted results on ClinicalTrials.gov, or in FDA draft guidance, and cites its sources. Accept a suggestion to apply the rewritten text in place; export the revised protocol with a change log.

## How it works

- `index.html` is a single-file app published as a claude.ai Artifact. It runs the review with the viewer's own Claude account via the artifact `sample` capability, so no API key is needed.
- `data/trials.json` is a compact index of 174 completed Phase 3 GLP-1 RA trials with posted results, pulled from the ClinicalTrials.gov v2 API (`scripts/compact_trials.py`). The reviewer searches it through page-side tools (`search_trials`, `get_trial`) during the review.
- FDA draft guidance (2023 T2D efficacy endpoints; Jan 2025 obesity drug development guidance Rev. 2 plus its Federal Register notice) is chunked and embedded for citation (`scripts/bundle.py`).
- `src-template.html` is the page without the embedded data; `scripts/bundle.py` produces the data blob that gets injected at `/*__DATA__*/`.

## Rebuild

```
python3 -m venv venv && ./venv/bin/pip install pypdf
./venv/bin/python scripts/extract_pdf_text.py <guidance.pdf> ...
python3 scripts/compact_trials.py && python3 scripts/bundle.py
```
