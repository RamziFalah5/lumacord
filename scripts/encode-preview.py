"""Optional GIF encoding from actual browser frames (requires Pillow)."""
from pathlib import Path
from PIL import Image

paths = sorted(Path('.local-backup/media-frames').glob('*.png'))
if len(paths) != 68:
    raise SystemExit('Capture the complete 68-frame sequence first.')
frames = []
for path in paths:
    with Image.open(path) as frame:
        frames.append(frame.convert('RGB').resize((960, 570), Image.Resampling.LANCZOS))
palette = frames[30].quantize(colors=128)
frames = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
frames[0].save('media/preview.gif', save_all=True, append_images=frames[1:], duration=130, loop=0, optimize=True)
print('Saved media/preview.gif from actual application frames.')
