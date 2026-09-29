# Design reference

Source of the approved redesign. Use these files as the visual spec; do not copy them into the app.

| File | Board | Used in step |
| --- | --- | --- |
| style-system.dc.html | Загварын систем (colors, type, buttons, tags, placeholders) | 1, 2 |
| home-desktop.dc.html | Нүүр — desktop | 2, 8 |
| home-mobile.dc.html | Нүүр — mobile | 2, 7, 8 |
| article-desktop.dc.html | Мэдээ — desktop | 6, 14 |
| category-desktop.dc.html | Ангилал — desktop | 7 |

## How to read the .dc.html files

- They are HTML with inline styles. Every size, color, gap and font is written on the element.
- `{{accent}}` = `#2E3BFF`, `{{brand}}` = site name (siteConfig.name), `{{initial}}` = its first letter.
- `<sc-for list="{{x}}" as="it">` repeats its children for each item in `x`. The sample data for each list is in the
  `renderVals()` function at the bottom of the file.
- `<sc-if>` is a conditional block. `<helmet>` holds fonts and a few pattern classes (`.ph`, `.dots`, `.dots-ink`).
- Sample headlines and `[ЗУРАГ]` boxes are placeholders, not real content.

## screenshots/

Put PNG exports of each board here (same names, `.png`). When a screenshot and the source disagree, the source wins.
