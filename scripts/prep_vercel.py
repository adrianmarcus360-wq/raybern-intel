#!/usr/bin/env python3
"""Prepare Vercel file deployment payload from Next.js static export."""
import json, os, base64

OUT_DIR = '/home/user/surething/cells/d1b7a914-6f2b-4631-a574-d017b61c229e/workspace/raybern-saas/out'

TEXT_EXTS = {'.html', '.css', '.js', '.json', '.txt', '.svg', '.xml', '.ico'}

files = []
for root, dirs, filenames in os.walk(OUT_DIR):
    for fname in filenames:
        full_path = os.path.join(root, fname)
        rel_path = os.path.relpath(full_path, OUT_DIR)
        
        ext = os.path.splitext(fname)[1].lower()
        
        with open(full_path, 'rb') as f:
            raw = f.read()
        
        if ext in TEXT_EXTS:
            try:
                data = raw.decode('utf-8')
                encoding = 'utf-8'
            except UnicodeDecodeError:
                data = base64.b64encode(raw).decode('ascii')
                encoding = 'base64'
        else:
            data = base64.b64encode(raw).decode('ascii')
            encoding = 'base64'
        
        files.append({'file': rel_path, 'data': data})
        print(f"  {rel_path} ({len(raw)} bytes, {encoding})")

print(f"\nTotal: {len(files)} files")

# Save for inspection
out_path = '/home/user/surething/cells/d1b7a914-6f2b-4631-a574-d017b61c229e/workspace/raybern-saas/vercel_files.json'
with open(out_path, 'w') as f:
    json.dump(files, f)
print(f"Saved to {out_path}")
print(f"Total payload size: {os.path.getsize(out_path) / 1024:.0f} KB")
