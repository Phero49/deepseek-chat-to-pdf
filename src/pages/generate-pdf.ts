import html2pdfmake from 'html-to-pdfmake'
import pdfmake from 'pdfmake/build/pdfmake'
import { type TDocumentDefinitions, type TFontDictionary } from 'pdfmake/interfaces'
import * as vfs from '../fonts/vfs_fonts'
import { elementToSVG, inlineResources } from 'dom-to-svg'

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

export async function exportRenderedLatexToPdf() {
  // Select the SVG element from the rendered LaTeX
  const latexElementx = document.querySelectorAll('.ds-markdown-math')

  for (const latexElement of latexElementx) {
    if (!latexElement) {
      alert('No LaTeX found!')
      return
    }
    const svgDocument = elementToSVG(latexElement)
    await inlineResources(svgDocument.documentElement)
    const svgString = new XMLSerializer().serializeToString(svgDocument)
    console.log(svgString)
    latexElement.innerHTML = svgString
  }
}
pdfmake.vfs = vfs
export async function generatePdf(html: HTMLElement, title: string) {
  processCodeBlocks(html)
  await exportRenderedLatexToPdf()
  const content = html2pdfmake(html.innerHTML)
  console.log(content)
  const fonts: TFontDictionary = {
    Arial: {
      normal: 'arial-normal.TTF',
      bold: 'ARIALBD.TTF',
      bolditalics: 'ARIALBI 1.TTF',
      italics: 'ARIALI.TTF',
    },
    Times: {
      normal: 'Times New Roman.ttf',
      bold: 'Times New Roman - Bold.ttf',
      bolditalics: 'Times New Roman - Bold Italic.ttf',
      italics: 'Times New Roman - Italic.ttf',
    },
  }
  pdfmake.fonts = fonts
  const docDefinition: TDocumentDefinitions = {
    content: [
      // Promotional Page
      {
        text: 'Check Out My App Xulhub!',
        style: 'header',
        // Ensures the next content starts on a new page
      },
      {
        text: [
          {
            text: 'Xulhub is a social education platform for sharing and discovering educational content. Join us at ',
          },
          {
            text: 'https://xulhub.com!',
            link: 'https://xulhub.com!',
            style: { color: 'red' },
          },
        ],
        style: 'subheader',
        margin: [0, 10, 0, 20],
        pageBreak: 'after', // Add some spacing
      },
      // Existing Content
      ...content, // Spread the existing content after the promotional page
    ],
    defaultStyle: {
      font: 'Times',
      fontSize: 12,
    },
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: 'blue',
        alignment: 'center',
      },
      subheader: {
        fontSize: 12,
        alignment: 'center',
        color: '#444', // Slightly darker gray
      },
    },
  }

  const pdf = pdfmake.createPdf(docDefinition as unknown as TDocumentDefinitions)
  pdf.download(`${title}.pdf`)
}

function processCodeBlocks(html: HTMLElement) {
  const banners = html.querySelectorAll<HTMLDivElement>('.md-code-block-banner-wrap')
  banners.forEach((e) => {
    e.style.display = 'none'
  })

  const codeBlocks = html.querySelectorAll<HTMLDivElement>('.md-code-block')
  for (const block of codeBlocks) {
    // Get computed styles for the block

    // Replace white or none with black or dark grey
    block.style.color = '#333'

    const pre = block.querySelector('pre')

    if (pre == null) {
      continue
    }

    // Update <pre> styles
    pre.style.color = '#333'
    // Update <span> styles inside <pre>
    const spans = pre.querySelectorAll('span')
    for (const span of spans) {
      const { color } = window.getComputedStyle(span)
      span.style.color = replaceInvalidColor(color)
    }
  }
}

// Helper function to replace invalid colors
function replaceInvalidColor(color: string): string {
  // Check if the color is white, transparent, or none
  if (color === 'white' || color === 'transparent' || color === 'none' || !color) {
    return '#333' // Dark grey as a fallback
  }
  return color // Return the original color if valid
}
