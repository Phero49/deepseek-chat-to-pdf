/* eslint-disable @typescript-eslint/no-explicit-any */
import TurndownService from 'turndown'
//import * as gfm from 'turndown-plugin-gfm'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import renderMathInElement from 'katex/contrib/auto-render'
//import * as gfm from 'turndown-plugin-gfm'
function turndownRawCodePlugin(turndownService: TurndownService) {
  turndownService.addRule('rawCodeBlock', {
    filter: function (node) {
      return (
        node.nodeName === 'CODE' &&
        node.hasAttribute('raw-code') &&
        node.parentElement?.nodeName === 'PRE'
      )
    },
    replacement: function (_content, node) {
      const raw = (node as HTMLElement).getAttribute('raw-code') || ''
      const lang =
        ((node as HTMLElement).getAttribute('class') || '')
          .split(/\s+/)
          .find((cls) => cls.startsWith('language-'))
          ?.replace('language-', '') || ''
      return `\n\`\`\`${lang}\n${raw}\n\`\`\`\n`
    },
  })
}

export async function getContentAsMarkdown(
  HTMLContent: HTMLDivElement,
  source: string,
): Promise<string | undefined> {
  try {
    const holders = await unrenderLatex(HTMLContent, source)

    console.log(holders)
    const turndownService = new TurndownService()
    //turndownService.use(gfm.gfm)
    turndownService.use(turndownRawCodePlugin)
    let markdown = turndownService.turndown(HTMLContent)
    if (source !== 'qwen') {
      for (const key of Object.keys(holders)) {
        markdown = markdown.replaceAll(key, holders[key] as string)
      }
    }

    return markdown
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw `failed to get content ${error as string}`
  }
}

function unrenderLatex(html: HTMLElement, source: string): Promise<Record<string, string>> {
  function getQwenMath(html: HTMLElement) {
    // Ensure html is not null or undefined
    if (!html) return

    // Select all <math> elements
    const mathElements = html.querySelectorAll('math')

    mathElements.forEach((el) => {
      const display = el.getAttribute('display')
      const annotation = el.querySelector('annotation')
      function normalizeMath(content: string): string {
        return (
          content
            // Fix unicode minus signs
            .replace(/\u2212/g, '-')
            // Remove duplicate spaces
            .replace(/\s+/g, ' ')
            // Trim
            .trim()
        )
      }

      // Default empty string if no annotation
      let mathData = ''
      if (annotation && annotation.textContent) {
        const clean = normalizeMath(annotation.textContent)
        // Choose math delimiters based on "display"
        if (display === 'block') {
          mathData = `\\[ ${clean} \\]`
        } else {
          mathData = `\\( ${clean} \\)`
        }
      }
      console.log(mathData)
      // Safely handle parent element
      let parent = el.parentElement
      if (parent) {
        // Traverse up while inside a <span> and not having "katex" class
        while (parent && parent.tagName === 'SPAN' && !parent.classList.contains('katex')) {
          parent = parent.parentElement
        }

        // Replace the <math> element with plain text node
        //const textNode = document.createTextNode(mathData)
        parent = parent?.parentElement as HTMLElement
        if (parent != null) {
          parent.innerHTML = mathData
          console.log(parent?.innerHTML)
        }
      }
    })
  }

  const holders: Record<string, string> = {}

  function getGeminiMath(html: HTMLElement) {
    const math = html.querySelectorAll('.math-block, .math-inline')
    math.forEach((el, i) => {
      const placeholder = `@@KATEX@PLACEHOLDER@${i}@@`
      holders[placeholder] = el.outerHTML
      el.replaceWith(placeholder)
    })
  }

  return new Promise((resolve, reject) => {
    // Select all elements that have the data-math attribute

    try {
      if (source == 'qwen') {
        getQwenMath(html)
      } else {
        getGeminiMath(html)
      }
      resolve(holders) // Once all replacements are done, resolve the Promise
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject(`failed to get math symbols ${error as string}`)
    }
  })
}

export function preserveLatex(md: any) {
  md.inline.ruler.before('escape', 'math_inline', function (state: any, silent: any) {
    const start = state.pos
    const src = state.src.slice(start)

    // Match \[...\] or \(...\)
    const match = src.match(/^\\\[([\s\S]+?)\\\]/) || src.match(/^\\\(([\s\S]+?)\\\)/)

    if (!match) return false

    if (!silent) {
      const token = state.push('math_preserve', '', 0)
      token.content = match[0] // keep full raw string (\[...\] or \(...\))
    }

    state.pos += match[0].length
    return true
  })

  // Renderer: convert LaTeX delimiters to $$ / $ and output data-math
  md.renderer.rules.math_preserve = function (tokens: any, idx: number) {
    let raw = tokens[idx].content as string

    // Normalize delimiters
    if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
      raw = raw.replace(/^\\\[/, '$$').replace(/\\\]$/, '$$')
    }

    // Output both visible content and data-math attribute
    return `<span data-math="${raw}">${raw}</span>`
  }
}

// export function renderLatexContent(el: HTMLElement) {
//   renderMathInElement(el, {
//     defaultMode: 'text',
//     readAloud: true,
//     TeX: {
//       delimiters: {
//         inline: [
//           ['$', '$'],
//           ['\\(', '\\)'],
//         ],
//         display: [
//           ['$$', '$$'],
//           ['\\[', '\\]'],
//         ],
//       },
//     },
//   });
// }

// keep a counter for prompts if index not provided
let promptCounter = 0

/**
 * Process Markdown and append to a target element
 *
 * @param params.text - The raw markdown string
 * @param params.el - The target HTML element to append content into
 * @param params.isPrompt - True if this is a user prompt, false if it’s a response
 * @param params.index - Optional explicit index (defaults to auto-increment for prompts)
 */
export function processMd({
  text = '',
  el,
  isPrompt,
  index,
  id,
  source,
}: {
  text?: string
  el: HTMLElement
  isPrompt: boolean
  index?: number
  id: string
  source: string
}) {
  // setup markdown renderer
  const md = MarkdownIt()
  console.log(source)
  if (source == 'chatgpt' || source == 'deepseek') {
    md.use(preserveLatex)
  }
  md.options.breaks = true
  //md.use(turndownRawCodePlugin)
  // render markdown safely
  let sanitizeContent: string = md.render(text)

  if (!isPrompt) {
    const temp = document.createElement('textarea')
    temp.innerHTML = sanitizeContent
    sanitizeContent = temp.value
  }
  // parse HTML string into DOM
  const parsed = new DOMParser().parseFromString(sanitizeContent, 'text/html')

  if (isPrompt) {
    // use provided index or auto-increment
    promptCounter = index ?? promptCounter + 1
    const usedIndex = promptCounter

    // wrap prompt in container

    const wrapper = document.createElement('div')

    // Apply your CSS as inline
    wrapper.style.cssText = `
  background-color: #ffeeba; /* warm yellowish background */
  border-left: 4px solid #ff9800; /* accent border for emphasis */
  margin: 12px 0; /* top and bottom spacing */
  padding: 12px 16px; /* comfortable inner padding */
  border-radius: 6px; /* slightly rounded corners */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); /* subtle shadow */
  font-weight: 500; /* slightly bolder text */
   font-size: 14px;
  color: #333;
`

    wrapper.id = id
    wrapper.setAttribute('data-prompt-index', String(usedIndex))

    // insert parsed content
    wrapper.append(...Array.from(parsed.body.childNodes))

    el.appendChild(wrapper)
  } else {
    // wrap response in container
    const wrapper = document.createElement('div')
    wrapper.classList.add('response-block', 'md-content')

    wrapper.append(...Array.from(parsed.body.childNodes))

    // highlight code blocks inside the response
    wrapper.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })

    el.appendChild(wrapper)
    setTimeout(() => {
      renderMathInElement(wrapper, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'], // skip code blocks
      })
      console.log('should render')
    }, 300)
  }
}
export type OutlineNode = {
  id: string
  title: string
  level: number
  children: OutlineNode[]
}

/**
 * Extracts a document outline (headings hierarchy) from an element,
 * attaching incremental IDs directly to DOM headings.
 */
export function getOutline(el: HTMLElement): OutlineNode[] {
  const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  const outline: OutlineNode[] = []
  const stack: OutlineNode[] = []
  let counter = 0

  for (const heading of headings) {
    const level = parseInt(heading.tagName.substring(1), 10)
    const rawTitle = heading.textContent?.trim() || ''

    // Only assign if missing
    if (!heading.id) {
      counter++
      heading.id = `heading-${counter}` // directly mutates the DOM element
    }

    const node: OutlineNode = {
      id: heading.id,
      title: rawTitle,
      level,
      children: [],
    }

    // Maintain hierarchy
    while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      outline.push(node)
    } else {
      stack[stack.length - 1]!.children.push(node)
    }

    stack.push(node)
  }

  return outline
}
