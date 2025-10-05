/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
//import html2pdfmake from 'html-to-pdfmake'
import pdfmake from 'pdfmake/build/pdfmake'
import type { Content } from 'pdfmake/interfaces'
import { type TDocumentDefinitions } from 'pdfmake/interfaces'
import type { OutlineNode } from 'src/utils/utils'
// import { getFont } from 'app/src-bex/utils/database'
// import { Notify } from 'quasar'
import html2canvas from 'html2canvas'
import { text } from 'stream/consumers'

// // Example of using it with KaTeX elements
// function handleConversion() {
//     try {
//         const svgs = convertKaTeXToSVG();

//         // Now you have an array of SVG strings that you can use
//         svgs.forEach((svg, index) => {
//             // You can now use these SVGs in your PDF generation
//             console.log(`SVG ${index + 1}:`, svg);
//         });

//         return svgs;
//     } catch (error) {
//         console.error('Error converting KaTeX to SVG:', error);
//         throw error;
//     }
// }

export async function exportRenderedLatexToPdf(source?: string) {
  // Select the SVG element from the rendered LaTeX
  const latexElements = document.querySelectorAll('.katex')
  //  console.log(source, latexElements.length)
  if (!(source == 'gemini')) {
    // latexElements =
    // }else{
  }

  for (const latexElement of latexElements) {
    if (!latexElement) {
      alert('No LaTeX found!')
      return
    }

    // Measure the LaTeX element
    const rect = latexElement.getBoundingClientRect()

    // Render LaTeX element into a canvas with html2canvas
    const canvas = await html2canvas(latexElement as HTMLElement, {
      scale: 0.8, // higher resolution
      width: rect.width,
      height: rect.height,
    })

    // Convert canvas to PNG data URL
    const dataUrl = canvas.toDataURL('image/png')

    // Replace the LaTeX element content with an <img>
    latexElement.innerHTML = ''
    const img = document.createElement('img')
    img.src = dataUrl

    // Ensure the image behaves like inline math
    img.style.display = 'inline' // default inline behavior
    img.style.verticalAlign = 'middle' // aligns nicely with surrounding text
    img.style.height = rect.height + 'px' // match original height

    latexElement.appendChild(img)

    // Debug: log base64 PNG string
    console.log(dataUrl)
  }
}

// Function to map OutlineNode tree to pdfmake tocItems
export function mapOutlineToPdfmake(nodes?: OutlineNode[]): any[] {
  if (nodes == undefined) {
    return []
  }
  const result: any[] = []

  function walk(node: OutlineNode) {
    // Push the current node as a pdfmake heading with tocItem
    result.push({
      text: node.title,
      style: 'header',
      tocItem: { id: node.id },
    })

    // Recurse into children
    node.children.forEach((child) => walk(child))
  }

  nodes.forEach((node) => walk(node))
  //console.log(result)

  return result
}

async function loadFontFiles(selectedFont: any) {
  const vfs: Record<string, string> = {}
  const formattedFont: Record<string, any> = {}
  const fontName = selectedFont.name
  formattedFont[fontName] = {}

  const promises = Object.entries(selectedFont.files).map(
    ([style, file]) =>
      new Promise<void>((resolve, reject) => {
        const fileObj = file as File
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1] ?? ''
            vfs[fileObj.name] = base64
            formattedFont[fontName][style] = fileObj.name
            resolve()
          } else {
            reject(new Error('Failed to read font file'))
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(fileObj)
      }),
  )

  await Promise.all(promises)

  pdfmake.vfs = vfs
  pdfmake.fonts = formattedFont

  return fontName
}
// This function generates a PDF using Chrome's printing API in an extension

// eslint-disable-next-line @typescript-eslint/require-await
export async function generatePdf(
  font: string,
  html: HTMLElement,
  title?: string,
  source?: string,
  outline?: OutlineNode[],
) {
  // Step 1: Convert the HTML element to a printable page
  // We'll use a hidden iframe to hold the content
  if (source) {
    //    void exportRenderedLatexToPdf(source)
  }

  const iframe = document.querySelector<HTMLIFrameElement>('#renderDocs')
  if (!iframe) return

  // Prepare iframe
  iframe.style.position = 'fixed'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.left = '-10000px' // keep off-screen
  const headContent = document.head.innerHTML.replace(/<script[\s\S]*?<\/script>/gi, '')
  //iframe.srcdoc = html.innerHTML
  console.log(headContent)
  const printContent = `<!DOCTYPE html>
<html>
<head>
${headContent}
</head>
<body>${html.innerHTML}</body>
</html>`

  iframe.srcdoc = printContent
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }, 2000)
  iframe.onload = async () => {
    const doc = iframe.contentDocument
    console.log(doc?.body.innerHTML)
    if (!doc) return

    // Wait for all fonts to load to avoid fallback fonts
    if (doc.fonts) {
      await doc.fonts.ready
    }

    // Optional: force print styles to match screen
    //   const style = doc.createElement('style')
    //   style.textContent = `
    //   @media print {
    //     body {
    //       font-family: sans-serif !important;
    //       line-height: 1.5 !important;
    //       margin: 0 !important;
    //     }
    //     svg, canvas {
    //       width: auto !important;
    //       height: auto !important;
    //     }
    //     pre, code {
    //       white-space: pre-wrap;
    //     }
    //   }
    // `
    //doc.head.appendChild(style)

    // Focus and trigger print
    // iframe.contentWindow?.focus()
    // iframe.contentWindow?.print()
  }

  // await loadFontFiles(font)
  const docDefinition: TDocumentDefinitions = {
    content: [],
  }
  const mappedDoc = Array.from(html.children).forEach((el) => {
    // if (el.classList.contains('user-prompt')) {
    //   ;(docDefinition.content as Content[]).push(
    //     {
    //       table: {
    //         widths: ['*'],
    //         body: [
    //           [
    //             {
    //               text: el.textContent,
    //               color: '#333',
    //               margin: [6, 4, 6, 4], // inner spacing – acts like padding
    //             },
    //           ],
    //         ],
    //       },
    //       layout: {
    //         fillColor: '#ffeeba', // background for the cell
    //         hLineWidth: () => 0,
    //         vLineWidth: () => 0,
    //       },
    //     },
    //     { text: '', margin: [10, 10] },
    //   )
    // } else if (el.classList.contains('response-block')) {
    //   Array.from(el.children).forEach((cEl) => {
    //     if (cEl.tagName == 'P') {
    //       console.log(cEl)
    //     }
    //   })
    // }
    return docDefinition
  })

  //pdfmake.createPdf(docDefinition).download(title + '.pdf')
}
