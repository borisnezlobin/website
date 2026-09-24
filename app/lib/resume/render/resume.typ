// Pure renderer: every variable part of the page arrives in sys.inputs.
// `selection` is the JSON built by selection.ts; `texture` is the header SVG from texture/.

#let sel = json(bytes(sys.inputs.selection))
#let s = sel.spacing
#let ink = rgb("#1b1a19")

#set document(author: sel.header.name, title: sel.header.name + " resume")

#set page(
  paper: "us-letter",
  margin: (x: sel.page.marginX * 1pt, y: sel.page.marginY * 1pt),
  background: if "texture" in sys.inputs {
    place(top + left, image(bytes(sys.inputs.texture), format: "svg", width: 100%))
  },
)

#set text(font: "Charter", size: sel.fontSize * 1pt, fill: ink, hyphenate: false, ligatures: false)
#set par(justify: true, leading: 0.65em * s)

#show link: it => underline(it, offset: 2.5pt, stroke: 0.5pt + ink)

#show heading.where(level: 2): it => block(above: 1.2em * s, below: 0.6em * s, width: 100%)[
  #text(size: 1.15em, weight: "bold", it.body)
  #v(-0.75em)
  #line(length: 100%, stroke: 0.6pt + ink)
]

#show list: set block(above: 0.8em * s, below: 1.1em * s)

#let markup(t) = eval(t, mode: "markup")
#let bullets(items) = if items.len() > 0 { list(..items.map(markup)) }
#let entry-gap = 0.15em

#let two-line-header(title, date, subtitle, location) = pad(top: entry-gap, grid(
  columns: (1fr, auto),
  column-gutter: 8pt,
  row-gutter: 0.65em * s,
  strong(title), align(right, date),
  subtitle, align(right, location),
))

#let header(name, contacts) = align(center)[
  #block(below: 0.55em, text(size: sel.page.nameSize * 1pt, weight: "bold", name))
  #contacts.map(c => link(c.at(0), c.at(1))).join(" | ")
]

#let edu(e) = {
  let gpa = e.at("gpa", default: none)
  let subtitle = if gpa == none { e.institution } else [#e.institution | GPA: #gpa]
  two-line-header(e.degree, e.date, subtitle, e.at("location", default: none))
}

#let exp(e) = {
  two-line-header(e.organization, e.date, e.role, e.at("location", default: none))
  bullets(e.bullets)
}

#let project-links(e) = {
  let links = ()
  if "liveUrl" in e { links.push(link(e.liveUrl, strong[Live])) }
  if "repoUrl" in e { links.push(link(e.repoUrl, strong[GitHub])) }
  links.join(" | ")
}

#let award-mark = box(baseline: 0.14em, image(bytes(sys.inputs.awardMark), format: "svg", height: 0.86em))

#let awarded-name(e) = {
  let named = [*#e.name*]
  if "award" not in e { return named }
  [#named#h(0.3em)#award-mark#h(0.24em)#text(size: 0.92em, e.award)]
}

#let project(e) = {
  let tech = e.at("technologies", default: ())
  let named = awarded-name(e)
  let title = if tech.len() > 0 [#named | #tech.map(emph).join(", ")] else { named }
  pad(top: entry-gap, grid(columns: (1fr, auto), column-gutter: 8pt, title, align(right, project-links(e))))
  bullets(e.bullets)
}

#let skills(e) = pad(top: entry-gap, list(..e.lines.map(l => [*#l.at(0)*: #l.at(1)])))

#let renderers = (
  edu: edu,
  exp: exp,
  project: project,
  text: e => block(width: 100%, markup(e.text)),
  skills: skills,
)

#header(sel.header.name, sel.header.contacts)

#for section in sel.sections [
  == #section.title
  #for e in section.entries { renderers.at(e.kind)(e) }
]

#context [#metadata((page: here().page(), y: here().position().y.pt())) <end>]
