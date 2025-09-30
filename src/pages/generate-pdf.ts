/* eslint-disable @typescript-eslint/no-explicit-any */
//import html2pdfmake from 'html-to-pdfmake'
//import pdfmake from 'pdfmake/build/pdfmake'
//import { type TDocumentDefinitions } from 'pdfmake/interfaces'
import type { OutlineNode } from 'src/utils/utils'
// import { getFont } from 'app/src-bex/utils/database'
// import { Notify } from 'quasar'
import html2canvas from 'html2canvas'

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
  console.log(source, latexElements.length)
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
  console.log(result)

  return result
}

// async function loadFontFiles(selectedFont: any) {
//   const vfs: Record<string, string> = {}
//   const formattedFont: Record<string, any> = {}
//   const fontName = selectedFont.name
//   formattedFont[fontName] = {}

//   const promises = Object.entries(selectedFont.files).map(
//     ([style, file]) =>
//       new Promise<void>((resolve, reject) => {
//         const fileObj = file as File
//         const reader = new FileReader()
//         reader.onload = () => {
//           if (typeof reader.result === 'string') {
//             const base64 = reader.result.split(',')[1] ?? ''
//             vfs[fileObj.name] = base64
//             formattedFont[fontName][style] = fileObj.name
//             resolve()
//           } else {
//             reject(new Error('Failed to read font file'))
//           }
//         }
//         reader.onerror = reject
//         reader.readAsDataURL(fileObj)
//       }),
//   )

//   await Promise.all(promises)

//   pdfmake.vfs = vfs
//   pdfmake.fonts = formattedFont

//   return fontName
// }
// This function generates a PDF using Chrome's printing API in an extension
export function generatePdf(
  font: string,
  html: HTMLElement,
  title: string,
  source?: string,
  outline?: OutlineNode[],
) {
  // Step 1: Convert the HTML element to a printable page
  // We'll use a hidden iframe to hold the content
  const iframe = document.querySelector<HTMLIFrameElement>('#renderDocs')
  console.log(source, outline, iframe)
  if (iframe == undefined) {
    return
  }
  iframe.style.position = 'fixed'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.left = '-10000px' // off-screen
  iframe.srcdoc = html.innerHTML
  setTimeout(() => {
    iframe.contentWindow?.print()
  }, 3000)
  // Apply custom font if provided
  // if (font) {
  //   const style = document.createElement('style');
  //   style.innerHTML = `
  //     @font-face {
  //       font-family: 'CustomFont';
  //       src: url(${font});
  //     }
  //     body { font-family: 'CustomFont'; }
  //   `;
  //   iframe.contentDocument?.head.appendChild(style);
  // }

  // Copy the HTML content into the iframe
  //  iframe.contentDocument!.body.innerHTML = html.innerHTML

  // Optional: add title or outline content
  // if (title) {
  //   const h1 = iframe.contentDocument!.createElement('h1')
  //   h1.innerText = title
  //   iframe.contentDocument!.body.prepend(h1)
  // }

  // Step 2: Use chrome.printing API to print without dialog
  // This only works in Chrome Extensions
  //const printJob: chrome.printing.SubmitJobRequest= {
  // job:{
  //     jobName: title || 'Document',
  // pageRanges: [{ from: 1, to: 999 }],
  // duplex: 'NO_DUPLEX',
  // }
}

// return new Promise<void>((resolve, reject) => {
//   chrome.printing.submitJob(printJob, (jobId) => {
//     if (chrome.runtime.lastError) {
//       reject(chrome.runtime.lastError)
//     } else {
//       console.log('Print job submitted:', jobId)
//       // Clean up iframe after printing
//       document.body.removeChild(iframe)
//       resolve()
//     }
//   })
// })

// function processCodeBlocks(html: HTMLElement) {
//   const banners = html.querySelectorAll<HTMLDivElement>('.md-code-block-banner-wrap')
//   banners.forEach((e) => {
//     e.style.display = 'none'
//   })

//   const codeBlocks = html.querySelectorAll<HTMLDivElement>('.md-code-block')
//   for (const block of codeBlocks) {
//     // Get computed styles for the block

//     // Replace white or none with black or dark grey
//     block.style.color = '#333'

//     const pre = block.querySelector('pre')

//     if (pre == null) {
//       continue
//     }

//     // Update <pre> styles
//     pre.style.color = '#333'
//     // Update <span> styles inside <pre>
//     const spans = pre.querySelectorAll('span')
//     for (const span of spans) {
//       const { color } = window.getComputedStyle(span)
//       span.style.color = replaceInvalidColor(color)
//     }
//   }
// }

// // Helper function to replace invalid colors
// function replaceInvalidColor(color: string): string {
//   // Check if the color is white, transparent, or none
//   if (color === 'white' || color === 'transparent' || color === 'none' || !color) {
//     return '#333' // Dark grey as a fallback
//   }
//   return color // Return the original color if valid
// }
