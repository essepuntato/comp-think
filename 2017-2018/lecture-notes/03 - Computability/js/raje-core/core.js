/**
 * 
 * Initilize TinyMCE editor with all required options
 */

// Invisible space constants
const ZERO_SPACE = '&#8203;'
const RAJE_SELECTOR = 'body#tinymce'

// Selector constants (to move inside a new const file)
const HEADER_SELECTOR = 'header.page-header.container.cgen'
const FIRST_HEADING = `${RAJE_SELECTOR}>section:first>h1:first`

const TINYMCE_TOOLBAR_HEIGTH = 76

let ipcRenderer, webFrame

if (hasBackend) {

  ipcRenderer = require('electron').ipcRenderer
  webFrame = require('electron').webFrame

  /**
   * Initilise TinyMCE 
   */
  $(document).ready(function () {

    // Override the margin botton given by RASH for the footer
    $('body').css({
      'margin-bottom': 0
    })

    //hide footer
    $('footer.footer').remove()

    //attach whole body inside a placeholder div
    $('body').html(`<div id="raje_root">${$('body').html()}</div>`)

    // 
    setNonEditableHeader()

    tinymce.init({

      // Select the element to wrap
      selector: '#raje_root',

      // Set window size
      height: window.innerHeight - TINYMCE_TOOLBAR_HEIGTH,

      // Set the styles of the content wrapped inside the element
      content_css: ['css/bootstrap.min.css', 'css/rash.css', 'css/raje-core.css'],

      // Set plugins
      plugins: "raje_inlineFigure fullscreen link codesample raje_externalLink raje_inlineCode raje_inlineQuote raje_section table image noneditable raje_image raje_quoteblock raje_codeblock raje_table raje_listing raje_inline_formula raje_formula raje_crossref raje_footnotes raje_metadata raje_lists raje_save",

      // Remove menubar
      menubar: false,

      // Custom toolbar
      toolbar: 'undo redo bold italic link superscript subscript raje_inlineCode raje_inlineQuote raje_inline_formula raje_crossref raje_footnotes | raje_ol raje_ul raje_codeblock raje_quoteblock raje_table raje_image raje_listing raje_formula | raje_section raje_metadata raje_save',

      // Setup full screen on init
      setup: function (editor) {

        let pasteBookmark

        // Set fullscreen 
        editor.on('init', function (e) {

          editor.execCommand('mceFullScreen')

          // Move caret at the first h1 element of main section
          // Or right after heading
          tinymce.activeEditor.selection.setCursorLocation(tinymce.activeEditor.dom.select(FIRST_HEADING)[0], 0)
        })

        editor.on('keyDown', function (e) {

          // Prevent shift+enter
          if (e.keyCode == 13 && e.shiftKey)
            e.preventDefault()

          if (e.keyCode == 86 && e.metaKey) {

            if ($(tinymce.activeEditor.selection.getNode()).is('pre')) {

              e.preventDefault()
              e.stopImmediatePropagation()

              pasteBookmark = tinymce.activeEditor.selection.getBookmark()
            }
          }
        })

        /**
         * 
         */
        editor.on('click', function (e) {

          // Capture the triple click event
          if (e.detail == 3) {

            e.preventDefault()
            e.stopImmediatePropagation()

            let wrapper = $(tinymce.activeEditor.selection.getRng().startContainer).parents('p,figcaption,:header').first()
            let startContainer = wrapper[0]
            let endContainer = wrapper[0]
            let range = document.createRange()

            // Check if the wrapper has more text node inside
            if (wrapper.contents().length > 1) {

              // If the first text node is a not editable strong, the selection must start with the second element
              if (wrapper.contents().first().is('strong[contenteditable=false]'))
                startContainer = wrapper.contents()[1]

              // In this case the endContainer will be the last text node
              endContainer = wrapper.contents().last()[0]
            }

            range.setStart(startContainer, 0)

            if (wrapper.is('figcaption'))
              range.setEnd(endContainer, endContainer.length)

            else
              range.setEnd(endContainer, 1)

            tinymce.activeEditor.selection.setRng(range)
          }

        })

        // Prevent span 
        editor.on('nodeChange', function (e) {

          let selectedElement = $(tinymce.activeEditor.selection.getNode())

          // Move caret to first heading if is after or before not editable header
          if (selectedElement.is('p') && (selectedElement.next().is(HEADER_SELECTOR) || (selectedElement.prev().is(HEADER_SELECTOR) && tinymce.activeEditor.dom.select(FIRST_HEADING).length)))
            tinymce.activeEditor.selection.setCursorLocation(tinymce.activeEditor.dom.select(FIRST_HEADING)[0], 0)

          // If the current element isn't inside header, only in section this is permitted
          if (selectedElement.parents('section').length) {

            if (selectedElement.is('span#_mce_caret[data-mce-bogus]') || selectedElement.parent().is('span#_mce_caret[data-mce-bogus]')) {

              // Remove span normally created with bold
              if (selectedElement.parent().is('span#_mce_caret[data-mce-bogus]'))
                selectedElement = selectedElement.parent()

              let bm = tinymce.activeEditor.selection.getBookmark()
              selectedElement.replaceWith(selectedElement.html())
              tinymce.activeEditor.selection.moveToBookmark(bm)
            }
          }

          updateDocumentState()
        })

        // Update saved content on undo and redo events
        editor.on('Undo', function (e) {
          tinymce.triggerSave()
        })

        editor.on('Redo', function (e) {
          tinymce.triggerSave()
        })

        editor.on('Paste', function (e) {

          let target = $(e.target)

          // If the paste event is called inside a listing
          if (pasteBookmark && target.parents('figure:has(pre:has(code))').length) {

            let data = e.clipboardData.getData('Text')

            // Restore the selection saved on cmd+v
            tinymce.activeEditor.selection.moveToBookmark(pasteBookmark)

            // Update the content
            tinymce.activeEditor.selection.setContent(e.clipboardData.getData('Text'))

            pasteBookmark = null
          }
        })
      },

      // Set default target
      default_link_target: "_blank",

      // Prepend protocol if the link starts with www
      link_assume_external_targets: true,

      // Hide target list
      target_list: false,

      // Hide title
      link_title: false,

      // Set formats
      formats: {
        underline: {}
      },

      // Remove "powered by tinymce"
      branding: false,

      // Prevent auto br on element insert
      apply_source_formatting: false,

      // Prevent non editable object resize
      object_resizing: false,

      // Update the table popover layout
      table_toolbar: "tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol",

      image_advtab: true,

      paste_block_drop: true,

      extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]",

      formula: {
        path: 'node_modules/tinymce-formula/'
      },

      cleanup_on_startup: false,
      trim_span_elements: false,
      verify_html: false,
      cleanup: false,
      convert_urls: false
    })
  })

  /**
   * Open and close the headings dropdown
   */
  $(window).load(function () {

    // Open and close menu headings Näive way
    $(`div[aria-label='heading']`).find('button').trigger('click')
    $(`div[aria-label='heading']`).find('button').trigger('click')
  })


  /**
   * Update content in the iframe, with the one stored by tinymce
   * And save/restore the selection
   */
  function updateIframeFromSavedContent() {

    // Save the bookmark 
    let bookmark = tinymce.activeEditor.selection.getBookmark(2, true)

    // Update iframe content
    tinymce.activeEditor.setContent($('#raje_root').html())

    // Restore the bookmark 
    tinymce.activeEditor.selection.moveToBookmark(bookmark)
  }

  /**
   * Accept a js object that exists in frame
   * @param {*} element 
   */
  function moveCaret(element, toStart) {
    tinymce.activeEditor.selection.select(element, true)
    tinymce.activeEditor.selection.collapse(toStart)

    tinymce.activeEditor.focus()
  }

  /**
   * 
   */
  function selectRange(startContainer, startOffset, endContainer, endOffset) {

    let range = document.createRange()
    range.setStart(startContainer, startOffset)

    // If these properties are not in the signature use the start
    if (!endContainer && !endOffset) {
      endContainer = startContainer
      endOffset = startOffset
    }

    range.setEnd(endContainer, endOffset)
    tinymce.activeEditor.selection.setRng(range)
  }

  /**
   * 
   * @param {*} element 
   */
  function moveCursorToEnd(element) {

    let heading = element
    let offset = 0

    if (heading.contents().length) {

      heading = heading.contents().last()

      // If the last node is a strong,em,q etc. we have to take its text 
      if (heading[0].nodeType != 3)
        heading = heading.contents().last()

      offset = heading[0].wholeText.length
    }

    tinymce.activeEditor.focus()
    tinymce.activeEditor.selection.setCursorLocation(heading[0], offset)
  }

  /**
   * 
   * @param {*} element 
   */
  function moveCursorToStart(element) {

    let heading = element
    let offset = 0

    tinymce.activeEditor.focus()
    tinymce.activeEditor.selection.setCursorLocation(heading[0], offset)
  }


  /**
   * Create custom into notification
   * @param {*} text 
   * @param {*} timeout 
   */
  function notify(text, type, timeout) {

    // Display only one notification, blocking all others
    if (tinymce.activeEditor.notificationManager.getNotifications().length == 0) {

      let notify = {
        text: text,
        type: type ? type : 'info',
        timeout: timeout ? timeout : 1000
      }

      tinymce.activeEditor.notificationManager.open(notify)
    }
  }

  /**
   * 
   * @param {*} elementSelector 
   */
  function scrollTo(elementSelector) {
    $(tinymce.activeEditor.getBody()).find(elementSelector).get(0).scrollIntoView();
  }

  /**
   * 
   */
  function getSuccessiveElementId(elementSelector, SUFFIX) {

    let lastId = 0

    $(elementSelector).each(function () {
      let currentId = parseInt($(this).attr('id').replace(SUFFIX, ''))
      lastId = currentId > lastId ? currentId : lastId
    })

    return `${SUFFIX}${lastId+1}`
  }

  /**
   * 
   */
  function headingDimension() {
    $('h1,h2,h3,h4,h5,h6').each(function () {

      if (!$(this).parents(HEADER_SELECTOR).length) {
        var counter = 0;
        $(this).parents("section").each(function () {
          if ($(this).children("h1,h2,h3,h4,h5,h6").length > 0) {
            counter++;
          }
        });
        $(this).replaceWith("<h" + counter + ">" + $(this).html() + "</h" + counter + ">")
      }
    });
  }

  /**
   * 
   */
  function checkIfPrintableChar(keycode) {

    return (keycode > 47 && keycode < 58) || // number keys
      (keycode == 32 || keycode == 13) || // spacebar & return key(s) (if you want to allow carriage returns)
      (keycode > 64 && keycode < 91) || // letter keys
      (keycode > 95 && keycode < 112) || // numpad keys
      (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
      (keycode > 218 && keycode < 223); // [\]' (in order)
  }

  /**
   * 
   */
  function markTinyMCE() {
    $('div[id^=mceu_]').attr('data-rash-original-content', '')
  }

  /**
   * 
   */
  function setNonEditableHeader() {
    $(HEADER_SELECTOR).addClass('mceNonEditable')
  }

  /**
   * 
   */
  function checkIfApp() {
    return ipcRenderer.sendSync('isAppSync')
  }

  /**
   * 
   */
  function selectImage() {
    return ipcRenderer.sendSync('selectImageSync')
  }



  /**
   * Send a message to the backend, notify the structural change
   * 
   * If the document is draft state = true
   * If the document is saved state = false
   */
  function updateDocumentState() {

    // Get the Iframe content not in xml 
    let JqueryIframe = $(`<div>${tinymce.activeEditor.getContent()}</div>`)
    let JquerySavedContent = $(`#raje_root`)

    // True if they're different, False is they're equal
    ipcRenderer.send('updateDocumentState', JqueryIframe.html() != JquerySavedContent.html())
  }

  /**
   * 
   */
  function saveAsArticle(options) {
    return ipcRenderer.send('saveAsArticle', options)
  }

  /**
   * 
   */
  function saveArticle(options) {
    return ipcRenderer.send('saveArticle', options)
  }

  /**
   * Start the save as process getting the data and sending it
   * to the main process
   */
  ipcRenderer.on('executeSaveAs', (event, data) => {
    saveManager.saveAs()
  })

  /**
   * Start the save process getting the data and sending it
   * to the main process
   */
  ipcRenderer.on('executeSave', (event, data) => {
    saveManager.save()
  })

  /**
   * 
   */
  ipcRenderer.on('notify', (event, data) => {
    notify(data.text, data.type, data.timeout)
  })

  /**
   * 
   */
  ipcRenderer.on('updateContent', (event, data) => {
    tinymce.triggerSave()
  })
}
tinymce.PluginManager.add('raje_crossref', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_crossref', {
    title: 'raje_crossref',
    icon: 'icon-anchor',
    tooltip: 'Cross-reference',
    disabledStateSelector: `${DISABLE_SELECTOR_INLINE},:header`,

    // Button behaviour
    onclick: function () {

      tinymce.triggerSave()

      let referenceableList = {
        sections: crossref.getAllReferenceableSections(),
        tables: crossref.getAllReferenceableTables(),
        figures: crossref.getAllReferenceableFigures(),
        listings: crossref.getAllReferenceableListings(),
        formulas: crossref.getAllReferenceableFormulas(),
        references: crossref.getAllReferenceableReferences()
      }

      editor.windowManager.open({
          title: 'Cross-reference editor',
          url: 'js/raje-core/plugin/raje_crossref.html',
          width: 500,
          height: 800,
          onClose: function () {

            /**
             * 
             * This behaviour is called when user press "ADD NEW REFERENCE" 
             * button from the modal
             */
            if (tinymce.activeEditor.createNewReference) {

              tinymce.activeEditor.undoManager.transact(function () {

                // Get successive biblioentry id
                let id = getSuccessiveElementId(BIBLIOENTRY_SELECTOR, BIBLIOENTRY_SUFFIX)

                // Create the reference that points to the next id
                crossref.add(id)

                // Add the next biblioentry
                section.addBiblioentry(id)

                // Update the reference
                crossref.update()

                // Move caret to start of the new biblioentry element
                // Issue #105 Firefox + Chromium
                tinymce.activeEditor.selection.setCursorLocation($(tinymce.activeEditor.dom.get(id)).find('p')[0], false)
                scrollTo(`${BIBLIOENTRY_SELECTOR}#${id}`)
              })

              // Set variable null for successive usages
              tinymce.activeEditor.createNewReference = null
            }

            /**
             * This is called if a normal reference is selected from modal
             */
            else if (tinymce.activeEditor.reference) {

              tinymce.activeEditor.undoManager.transact(function () {

                // Create the empty anchor and update its content
                crossref.add(tinymce.activeEditor.reference)
                crossref.update()

                let selectedNode = $(tinymce.activeEditor.selection.getNode())

                // This select the last element (last by order) and collapse the selection after the node
                // #105 Firefox + Chromium
                //tinymce.activeEditor.selection.setCursorLocation($(tinymce.activeEditor.dom.select(`a[href="#${tinymce.activeEditor.reference}"]:last-child`))[0], false)
              })

              // Set variable null for successive usages
              tinymce.activeEditor.reference = null
            }
          }
        },

        // List of all referenceable elements
        referenceableList)
    }
  })

  crossref = {
    getAllReferenceableSections: function () {

      let sections = []

      $('section').each(function () {

        let level = ''

        // Sections without role have :after
        if (!$(this).attr('role')) {

          // Save its deepness
          let parentSections = $(this).parentsUntil('div#raje_root')

          if (parentSections.length) {

            // Iterate its parents backwards (higer first)
            for (let i = parentSections.length; i--; i > 0) {
              let section = $(parentSections[i])
              level += `${section.parent().children(SECTION_SELECTOR).index(section)+1}.`
            }
          }

          // Current index
          level += `${$(this).parent().children(SECTION_SELECTOR).index($(this))+1}.`
        }

        sections.push({
          reference: $(this).attr('id'),
          text: $(this).find(':header').first().text(),
          level: level
        })
      })

      return sections
    },

    getAllReferenceableTables: function () {
      let tables = []

      $('figure:has(table)').each(function () {
        tables.push({
          reference: $(this).attr('id'),
          text: $(this).find('figcaption').text()
        })
      })

      return tables
    },

    getAllReferenceableListings: function () {
      let listings = []

      $('figure:has(pre:has(code))').each(function () {
        listings.push({
          reference: $(this).attr('id'),
          text: $(this).find('figcaption').text()
        })
      })

      return listings
    },

    getAllReferenceableFigures: function () {
      let figures = []

      $('figure:has(p:has(img)),figure:has(p:has(svg))').each(function () {
        figures.push({
          reference: $(this).attr('id'),
          text: $(this).find('figcaption').text()
        })
      })

      return figures
    },

    getAllReferenceableFormulas: function () {
      let formulas = []

      $(formulabox_selector).each(function () {

        formulas.push({
          reference: $(this).parents(FIGURE_SELECTOR).attr('id'),
          text: `Formula ${$(this).parents(FIGURE_SELECTOR).find('span.cgen').text()}`
        })
      })

      return formulas
    },

    getAllReferenceableReferences: function () {
      let references = []

      $('section[role=doc-bibliography] li').each(function () {
        references.push({
          reference: $(this).attr('id'),
          text: $(this).text(),
          level: $(this).index() + 1
        })
      })

      return references
    },

    add: function (reference, next) {

      // Create the empty reference with a whitespace at the end
      tinymce.activeEditor.selection.setContent(`<a contenteditable="false" href="#${reference}">&nbsp;</a>&nbsp;`)
      tinymce.triggerSave()
    },

    update: function () {

      // Update the reference (in saved content)
      references()

      // Prevent adding of nested a as footnotes
      $('a>sup>a').each(function () {
        $(this).parent().html($(this).text())
      })

      // Update editor with the right references
      updateIframeFromSavedContent()
    }
  }
})

tinymce.PluginManager.add('raje_footnotes', function (editor, url) {

  editor.addButton('raje_footnotes', {
    title: 'raje_footnotes',
    icon: 'icon-footnotes',
    tooltip: 'Footnote',
    disabledStateSelector: `${DISABLE_SELECTOR_INLINE},:header`,

    // Button behaviour
    onclick: function () {

      tinymce.activeEditor.undoManager.transact(function () {

        // Get successive biblioentry id
        let reference = getSuccessiveElementId(ENDNOTE_SELECTOR, ENDNOTE_SUFFIX)

        // Create the reference that points to the next id
        crossref.add(reference)

        // Add the next biblioentry
        section.addEndnote(reference)

        // Update the reference
        crossref.update()

        // Move caret at the end of p in last inserted endnote
        tinymce.activeEditor.selection.setCursorLocation(tinymce.activeEditor.dom.select(`${ENDNOTE_SELECTOR}#${reference}>p`)[0], 1)
      })
    }
  })
})

function references() {
  /* References */
  $("a[href]").each(function () {
    if ($.trim($(this).text()) == '') {
      var cur_id = $(this).attr("href");
      original_content = $(this).html()
      original_reference = cur_id
      referenced_element = $(cur_id);

      if (referenced_element.length > 0) {
        referenced_element_figure = referenced_element.find(
          figurebox_selector_img + "," + figurebox_selector_svg);
        referenced_element_table = referenced_element.find(tablebox_selector_table);
        referenced_element_formula = referenced_element.find(
          formulabox_selector_img + "," + formulabox_selector_span + "," + formulabox_selector_math + "," + formulabox_selector_svg);
        referenced_element_listing = referenced_element.find(listingbox_selector_pre);
        /* Special sections */
        if (
          $("section[role=doc-abstract]" + cur_id).length > 0 ||
          $("section[role=doc-bibliography]" + cur_id).length > 0 ||
          $("section[role=doc-endnotes]" + cur_id + ", section[role=doc-footnotes]" + cur_id).length > 0 ||
          $("section[role=doc-acknowledgements]" + cur_id).length > 0) {
          $(this).html("<span class=\"cgen\" contenteditable=\"false\"  data-rash-original-content=\"" + original_content +
            "\">Section <q>" + $(cur_id + " > h1").text() + "</q></span>");
          /* Bibliographic references */
        } else if ($(cur_id).parents("section[role=doc-bibliography]").length > 0) {
          var cur_count = $(cur_id).prevAll("li").length + 1;
          $(this).html("<span class=\"cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
            "\" title=\"Bibliographic reference " + cur_count + ": " +
            $(cur_id).text().replace(/\s+/g, " ").trim() + "\">[" + cur_count + "]</span>");
          /* Footnote references (doc-footnotes and doc-footnote included for easing back compatibility) */
        } else if ($(cur_id).parents("section[role=doc-endnotes], section[role=doc-footnotes]").length > 0) {
          var cur_contents = $(this).parent().contents();
          var cur_index = cur_contents.index($(this));
          var prev_tmp = null;
          while (cur_index > 0 && !prev_tmp) {
            cur_prev = cur_contents[cur_index - 1];
            if (cur_prev.nodeType != 3 || $(cur_prev).text().replace(/ /g, '') != '') {
              prev_tmp = cur_prev;
            } else {
              cur_index--;
            }
          }
          var prev_el = $(prev_tmp);
          var current_id = $(this).attr("href");
          var footnote_element = $(current_id);
          if (footnote_element.length > 0 &&
            footnote_element.parent("section[role=doc-endnotes], section[role=doc-footnotes]").length > 0) {
            var count = $(current_id).prevAll("section").length + 1;
            if (prev_el.find("sup").hasClass("fn")) {
              $(this).before("<sup class=\"cgen\" contenteditable=\"false\" data-rash-original-content=\"\">,</sup>");
            }
            $(this).html("<sup class=\"fn cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content + "\">" +
              "<a name=\"fn_pointer_" + current_id.replace("#", "") +
              "\" title=\"Footnote " + count + ": " +
              $(current_id).text().replace(/\s+/g, " ").trim() + "\">" + count + "</a></sup>");
          } else {
            $(this).html("<span class=\"error cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
              "\">ERR: footnote '" + current_id.replace("#", "") + "' does not exist</span>");
          }
          /* Common sections */
        } else if ($("section" + cur_id).length > 0) {
          var cur_count = $(cur_id).findHierarchicalNumber(
            "section:not([role=doc-abstract]):not([role=doc-bibliography]):" +
            "not([role=doc-endnotes]):not([role=doc-footnotes]):not([role=doc-acknowledgements])");
          if (cur_count != null && cur_count != "") {
            $(this).html("<span class=\"cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
              "\">Section " + cur_count + "</span>");
          }
          /* Reference to figure boxes */
        } else if (referenced_element_figure.length > 0) {
          var cur_count = referenced_element_figure.findNumber(figurebox_selector);
          if (cur_count != 0) {
            $(this).html("<span class=\"cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
              "\">Figure " + cur_count + "</span>");
          }
          /* Reference to table boxes */
        } else if (referenced_element_table.length > 0) {
          var cur_count = referenced_element_table.findNumber(tablebox_selector);
          if (cur_count != 0) {
            $(this).html("<span class=\"cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
              "\">Table " + cur_count + "</span>");
          }
          /* Reference to formula boxes */
        } else if (referenced_element_formula.length > 0) {
          var cur_count = referenced_element_formula.findNumber(formulabox_selector);
          if (cur_count != 0) {
            $(this).html("<span class=\"cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
              "\">Formula " + cur_count + "</span>");
          }
          /* Reference to listing boxes */
        } else if (referenced_element_listing.length > 0) {
          var cur_count = referenced_element_listing.findNumber(listingbox_selector);
          if (cur_count != 0) {
            $(this).html("<span class=\"cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
              "\">Listing " + cur_count + "</span>");
          }
        } else {
          $(this).html("<span class=\"error cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
            "\">ERR: referenced element '" + cur_id.replace("#", "") +
            "' has not the correct type (it should be either a figure, a table, a formula, a listing, or a section)</span>");
        }
      } else {
        $(this).replaceWith("<span class=\"error cgen\" contenteditable=\"false\" data-rash-original-content=\"" + original_content +
          "\">ERR: referenced element '" + cur_id.replace("#", "") + "' does not exist</span>");
      }
    }
  });
  /* /END References */
}

function updateReferences() {

  if ($('span.cgen[data-rash-original-content]').length) {

    // Restore all saved content
    $('span.cgen[data-rash-original-content]').each(function () {

      // Save original content and reference
      let original_content = $(this).attr('data-rash-original-content')
      let original_reference = $(this).parent('a').attr('href')

      $(this).parent('a').replaceWith(`<a contenteditable="false" href="${original_reference}">${original_content}</a>`)
    })

    references()
  }
}
/**
 * This script contains all figure box available with RASH.
 * 
 * plugins:
 *  raje_table
 *  raje_figure
 *  raje_formula
 *  raje_listing
 */
const DISABLE_SELECTOR_FIGURES = 'figure *, h1, h2, h3, h4, h5, h6'

const FIGURE_SELECTOR = 'figure[id]'

const FIGURE_TABLE_SELECTOR = `${FIGURE_SELECTOR}:has(table)`
const TABLE_SUFFIX = 'table_'

const FIGURE_IMAGE_SELECTOR = `${FIGURE_SELECTOR}:has(img:not([role=math]))`
const IMAGE_SUFFIX = 'img_'

const FIGURE_FORMULA_SELECTOR = `${FIGURE_SELECTOR}:has(svg[role=math])`
const INLINE_FORMULA_SELECTOR = `span:has(svg[role=math])`
const FORMULA_SUFFIX = 'formula_'

const FIGURE_LISTING_SELECTOR = `${FIGURE_SELECTOR}:has(pre:has(code))`
const LISTING_SUFFIX = 'listing_'

let remove_listing = 0

/**
 * Raje_table
 */
tinymce.PluginManager.add('raje_table', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_table', {
    title: 'raje_table',
    icon: 'icon-table',
    tooltip: 'Table',
    disabledStateSelector: DISABLE_SELECTOR_FIGURES,

    // Button behaviour
    onclick: function () {

      // On click a dialog is opened
      editor.windowManager.open({
        title: 'Select Table size',
        body: [{
          type: 'textbox',
          name: 'width',
          label: 'Columns'
        }, {
          type: 'textbox',
          name: 'heigth',
          label: 'Rows'
        }],
        onSubmit: function (e) {

          // Get width and heigth
          table.add(e.data.width, e.data.heigth)
        }
      })
    }
  })

  // Because some behaviours aren't accepted, RAJE must check selection and accept backspace, canc and enter press
  editor.on('keyDown', function (e) {

    // keyCode 8 is backspace, 46 is canc
    if (e.keyCode == 8)
      return handleFigureDelete(tinymce.activeEditor.selection)

    if (e.keyCode == 46)
      return handleFigureCanc(tinymce.activeEditor.selection)

    // Handle enter key in figcaption
    if (e.keyCode == 13)
      return handleFigureEnter(tinymce.activeEditor.selection)

    e.stopPropagation()
  })

  // Handle strange structural modification empty figures or with caption as first child
  editor.on('nodeChange', function (e) {
    handleFigureChange(tinymce.activeEditor.selection)
  })

  table = {

    /**
     * Add the new table (with given size) at the caret position
     */
    add: function (width, heigth) {

      // Get the reference of the current selected element
      let selectedElement = $(tinymce.activeEditor.selection.getNode())

      // Get the reference of the new created table
      let newTable = this.create(width, heigth, getSuccessiveElementId(FIGURE_TABLE_SELECTOR, TABLE_SUFFIX))

      // Begin atomic UNDO level 
      tinymce.activeEditor.undoManager.transact(function () {

        // Check if the selected element is not empty, and add table after
        if (selectedElement.text().trim().length != 0) {

          // If selection is at start of the selected element
          if (tinymce.activeEditor.selection.getRng().startOffset == 0)
            selectedElement.before(newTable)

          else
            selectedElement.after(newTable)
        }

        // If selected element is empty, replace it with the new table
        else
          selectedElement.replaceWith(newTable)

        // Save updates 
        tinymce.triggerSave()

        // Update all captions with RASH function
        captions()

        // Update Rendered RASH
        updateIframeFromSavedContent()
      })
    },

    /**
     * Create the new table using passed width and height
     */
    create: function (width, height, id) {

      // If width and heigth are positive
      try {
        if (width > 0 && height > 0) {

          // Create figure and table
          let figure = $(`<figure id="${id}"></figure>`)
          let table = $(`<table></table>`)

          // Populate with width & heigth
          for (let i = 0; i <= height; i++) {

            let row = $(`<tr></tr>`)
            for (let x = 0; x < width; x++) {

              if (i == 0)
                row.append(`<th>Heading cell ${x+1}</th>`)

              else
                row.append(`<td><p>Data cell ${x+1}</p></td>`)
            }

            table.append(row)
          }

          figure.append(table)
          figure.append(`<figcaption>Caption.</figcaption>`)

          return figure
        }
      } catch (e) {}
    }
  }
})

/**
 * Raje_figure
 */
tinymce.PluginManager.add('raje_image', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_image', {
    title: 'raje_image',
    icon: 'icon-image',
    tooltip: 'Image block',
    disabledStateSelector: DISABLE_SELECTOR_FIGURES,

    // Button behaviour
    onclick: function () {

      let filename = selectImage()

      if (filename != null)
        image.add(filename, filename)
    }
  })

  // Because some behaviours aren't accepted, RAJE must check selection and accept backspace, canc and enter press
  editor.on('keyDown', function (e) {

    // keyCode 8 is backspace
    if (e.keyCode == 8)
      return handleFigureDelete(tinymce.activeEditor.selection)

    if (e.keyCode == 46)
      return handleFigureCanc(tinymce.activeEditor.selection)

    // Handle enter key in figcaption
    if (e.keyCode == 13)
      return handleFigureEnter(tinymce.activeEditor.selection)
  })

  image = {

    /**
     * 
     */
    add: function (url, alt) {

      // Get the referece of the selected element
      let selectedElement = $(tinymce.activeEditor.selection.getNode())
      let newFigure = this.create(url, alt, getSuccessiveElementId(FIGURE_IMAGE_SELECTOR, IMAGE_SUFFIX))

      // Begin atomic UNDO level 
      tinymce.activeEditor.undoManager.transact(function () {

        // Check if the selected element is not empty, and add table after
        if (selectedElement.text().trim().length != 0) {

          // If selection is at start of the selected element
          if (tinymce.activeEditor.selection.getRng().startOffset == 0)
            selectedElement.before(newFigure)

          else
            selectedElement.after(newFigure)
        }

        // If selected element is empty, replace it with the new table
        else
          selectedElement.replaceWith(newFigure)

        // Save updates 
        tinymce.triggerSave()

        // Update all captions with RASH function
        captions()

        // Update Rendered RASH
        updateIframeFromSavedContent()
      })
    },

    /**
     * 
     */
    create: function (url, alt, id) {
      return $(`<figure id="${id}"><p><img src="${url}" ${alt?'alt="'+alt+'"':''} /></p><figcaption>Caption.</figcaption></figure>`)
    }
  }
})

/**
 * Raje_formula
 */

function openFormulaEditor(formulaValue, callback) {
  tinymce.activeEditor.windowManager.open({
      title: 'Math formula editor',
      url: 'js/raje-core/plugin/raje_formula.html',
      width: 800,
      height: 500,
      onClose: function () {

        let output = tinymce.activeEditor.formula_output

        // If at least formula is written
        if (output != null) {

          // If has id, RAJE must update it
          if (output.formula_id)
            formula.update(output.formula_svg, output.formula_id)

          // Or add it normally
          else
            formula.add(output.formula_svg)

          // Set formula null
          tinymce.activeEditor.formula_output = null
        }

        tinymce.activeEditor.windowManager.close()
      }
    },
    formulaValue
  )
}

tinymce.PluginManager.add('raje_formula', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_formula', {
    title: 'raje_formula',
    icon: 'icon-formula',
    tooltip: 'Formula',
    disabledStateSelector: DISABLE_SELECTOR_FIGURES,

    // Button behaviour
    onclick: function () {
      openFormulaEditor()
    }
  })

  // Because some behaviours aren't accepted, RAJE must check selection and accept backspace, canc and enter press
  editor.on('keyDown', function (e) {

    // keyCode 8 is backspace
    if (e.keyCode == 8)
      return handleFigureDelete(tinymce.activeEditor.selection)

    if (e.keyCode == 46)
      return handleFigureCanc(tinymce.activeEditor.selection)

    // Handle enter key in figcaption
    if (e.keyCode == 13)
      return handleFigureEnter(tinymce.activeEditor.selection)
  })

  editor.on('click', function (e) {
    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    // Open formula editor clicking on math formulas
    if (selectedElement.parents(FIGURE_SELECTOR).length && selectedElement.children('svg[role=math]').length) {

      openFormulaEditor({
        formula_val: selectedElement.children('svg[role=math]').attr('data-math-original-input'),
        formula_id: selectedElement.parents(FIGURE_SELECTOR).attr('id')
      })
    }
  })

  formula = {
    /**
     * 
     */
    add: function (formula_svg) {

      let selectedElement = $(tinymce.activeEditor.selection.getNode())
      let newFormula = this.create(formula_svg, getSuccessiveElementId(`${FIGURE_FORMULA_SELECTOR},${INLINE_FORMULA_SELECTOR}`, FORMULA_SUFFIX))

      tinymce.activeEditor.undoManager.transact(function () {

        // Check if the selected element is not empty, and add table after
        if (selectedElement.text().trim().length != 0)
          selectedElement.after(newFormula)

        // If selected element is empty, replace it with the new table
        else
          selectedElement.replaceWith(newFormula)

        // Save updates 
        tinymce.triggerSave()

        captions()

        // Update Rendered RASH
        updateIframeFromSavedContent()
      })

    },

    /**
     * 
     */
    update: function (formula_svg, formula_id) {

      let selectedFigure = $(`#${formula_id}`)

      tinymce.activeEditor.undoManager.transact(function () {

        selectedFigure.find('svg').replaceWith(formula_svg)
        updateIframeFromSavedContent()
      })
    },

    /**
     * 
     */
    create: function (formula_svg, id) {
      //return `<figure id="${id}"><p><span role="math" contenteditable="false">\`\`${formula_input}\`\`</span></p></figure>`
      return `<figure id="${id}"><p><span contenteditable="false">${formula_svg[0].outerHTML}</span></p></figure>`
    }
  }
})

function openInlineFormulaEditor(formulaValue, callback) {
  tinymce.activeEditor.windowManager.open({
      title: 'Math formula editor',
      url: 'js/rajemce/plugin/raje_formula.html',
      width: 800,
      height: 500,
      onClose: function () {

        let output = tinymce.activeEditor.formula_output

        // If at least formula is written
        if (output != null) {

          // If has id, RAJE must update it
          if (output.formula_id)
            inline_formula.update(output.formula_svg, output.formula_id)

          // Or add it normally
          else
            inline_formula.add(output.formula_svg)

          // Set formula null
          tinymce.activeEditor.formula_output = null
        }

        tinymce.activeEditor.windowManager.close()
      }
    },
    formulaValue
  )
}

tinymce.PluginManager.add('raje_inline_formula', function (editor, url) {

  editor.addButton('raje_inline_formula', {
    icon: 'icon-inline-formula',
    tooltip: 'Inline formula',
    disabledStateSelector: `${DISABLE_SELECTOR_INLINE},:header`,

    // Button behaviour
    onclick: function () {
      openInlineFormulaEditor()
    }
  })

  editor.on('click', function (e) {
    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    // Open formula editor clicking on math formulas
    if (selectedElement.children('svg[role=math]').length) {

      openInlineFormulaEditor({
        formula_val: selectedElement.children('svg[role=math]').attr('data-math-original-input'),
        formula_id: selectedElement.attr('id')
      })
    }
  })

  inline_formula = {
    /**
     * 
     */
    add: function (formula_svg) {

      let selectedElement = $(tinymce.activeEditor.selection.getNode())
      let newFormula = this.create(formula_svg, getSuccessiveElementId(`${FIGURE_FORMULA_SELECTOR},${INLINE_FORMULA_SELECTOR}`, FORMULA_SUFFIX))

      tinymce.activeEditor.undoManager.transact(function () {

        tinymce.activeEditor.selection.setContent(newFormula)

        // Save updates 
        tinymce.triggerSave()

        captions()

        // Update Rendered RASH
        updateIframeFromSavedContent()
      })

    },

    /**
     * 
     */
    update: function (formula_svg, formula_id) {

      let selectedFigure = $(`#${formula_id}`)

      tinymce.activeEditor.undoManager.transact(function () {

        selectedFigure.find('svg').replaceWith(formula_svg)
        updateIframeFromSavedContent()
      })
    },

    /**
     * 
     */
    create: function (formula_svg, id) {
      return `<span id="${id}" contenteditable="false">${formula_svg[0].outerHTML}</span>`
    }
  }
})

/**
 * Raje_listing
 */
tinymce.PluginManager.add('raje_listing', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_listing', {
    title: 'raje_listing',
    icon: 'icon-listing',
    tooltip: 'Listing',
    disabledStateSelector: DISABLE_SELECTOR_FIGURES,

    // Button behaviour
    onclick: function () {
      listing.add()
    }
  })



  // Because some behaviours aren't accepted, RAJE must check selection and accept backspace, canc and enter press
  editor.on('keyDown', function (e) {

    /**
     * NOTE: this behvaiour is the same for codeblock
     */
    let selectedElement = $(tinymce.activeEditor.selection.getNode())
    if (selectedElement.parents('pre:has(code)').length) {

      /**
       * Proper listing editor behaviour
       */
      if (selectedElement.is('code')) {

        /**
         * ENTER
         */
        if (e.keyCode == 13) {
          e.preventDefault()
          return listing.setContent(`\n${ZERO_SPACE}`)
        }

        /**
         * TAB
         */
        if (e.keyCode == 9) {
          e.preventDefault()
          return listing.setContent(`\t`)
        }
      }

      if (e.keyCode == 13)
        return handleFigureEnter(tinymce.activeEditor.selection)

      // keyCode 8 is backspace
      if (e.keyCode == 8)
        return handleFigureDelete(tinymce.activeEditor.selection)

      /*
      // keyCode 8 is backspace
      if (e.keyCode == 8)
        return handleFigureDelete(tinymce.activeEditor.selection)

      if (e.keyCode == 46)
        return handleFigureCanc(tinymce.activeEditor.selection)

      // Handle enter key in figcaption
      if (e.keyCode == 13)
        return handleFigureEnter(tinymce.activeEditor.selection)
        */
    }
    /*
    if (e.keyCode == 9) {
      if (tinymce.activeEditor.selection.isCollapsed() && $(tinymce.activeEditor.selection.getNode()).parents(`code,${FIGURE_SELECTOR}`).length) {
        tinymce.activeEditor.selection.setContent('\t')
        return false
      }
    }

    if (e.keyCode == 37) {
      let range = tinymce.activeEditor.selection.getRng()
      let startNode = $(range.startContainer)
      if (startNode.parent().is('code') && (startNode.parent().contents().index(startNode) == 0 && range.startOffset == 1)) {
        tinymce.activeEditor.selection.setCursorLocation(startNode.parents(FIGURE_SELECTOR).prev('p,:header')[0], 1)
        return false
      }
    }*/
  })

  listing = {
    /**
     * 
     */
    add: function () {

      let selectedElement = $(tinymce.activeEditor.selection.getNode())
      let newListing = this.create(getSuccessiveElementId(FIGURE_LISTING_SELECTOR, LISTING_SUFFIX))

      tinymce.activeEditor.undoManager.transact(function () {

        // Check if the selected paragraph is not empty, add the new listing right below
        if (selectedElement.text().trim().length != 0)
          selectedElement.after(newListing)

        // If selected paragraph is empty, replace it with the new table
        else
          selectedElement.replaceWith(newListing)

        // Save updates 
        tinymce.triggerSave()

        // Update all captions with RASH function
        captions()

        // Move the caret
        selectRange(newListing.find('code')[0], 0)

        // Update Rendered RASH
        updateIframeFromSavedContent()
      })

    },

    /**
     * 
     */
    create: function (id) {
      return $(`<figure id="${id}"><pre><code>${ZERO_SPACE}</code></pre><figcaption>Caption.</figcaption></figure>`)
    },

    /**
     * 
     */
    setContent: function (char) {
      tinymce.activeEditor.selection.setContent(char)
    }
  }
})

/**
 * Raje codeblock
 */
tinymce.PluginManager.add('raje_codeblock', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_codeblock', {
    title: 'raje_codeblock',
    icon: 'icon-block-code',
    tooltip: 'Block code',
    disabledStateSelector: `${DISABLE_SELECTOR_FIGURES},code,pre`,

    // Button behaviour
    onclick: function () {
      blockcode.add()
    }
  })

  blockcode = {
    /**
     * 
     */
    add: function () {

      let selectedElement = $(tinymce.activeEditor.selection.getNode())
      let blockCode = this.create(getSuccessiveElementId(FIGURE_LISTING_SELECTOR, LISTING_SUFFIX))

      if (!selectedElement.parents('pre,code').length) {

        tinymce.activeEditor.undoManager.transact(function () {

          // Check if the selected paragraph is not empty, add the new listing right below
          if (selectedElement.text().trim().length != 0)
            selectedElement.after(blockCode)

          // If selected paragraph is empty, replace it with the new table
          else
            selectedElement.replaceWith(blockCode)

          // Save updates 
          tinymce.triggerSave()

          // Update all captions with RASH function
          captions()

          // Move the caret
          selectRange(blockCode.find('code')[0], 0)

          // Update Rendered RASH
          updateIframeFromSavedContent()
        })
      }
    },

    /**
     * 
     */
    create: function (id) {
      return $(`<pre><code>${ZERO_SPACE}</code></pre>`)
    }
  }
})

/**
 * Raje quoteblock
 */
tinymce.PluginManager.add('raje_quoteblock', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_quoteblock', {
    title: 'raje_quoteblock',
    icon: 'icon-block-quote',
    tooltip: 'Block quote',
    disabledStateSelector: `${DISABLE_SELECTOR_FIGURES},blockquote`,

    // Button behaviour
    onclick: function () {
      blockquote.add()
    }
  })

  editor.on('keyDown', function (e) {

    let selectedElement = $(tinymce.activeEditor.selection.getNode())
    if (selectedElement.is('p') && selectedElement.parent().is('blockquote')) {

      /**
       * Enter
       */
      if (e.keyCode == 13) {
        e.preventDefault()

        // Exit from the blockquote if the current p is empty
        if (selectedElement.text().trim().length == 0)
          return blockquote.exit()

        blockquote.addParagraph()
      }
    }
  })

  blockquote = {
    /**
     * 
     */
    add: function () {

      let selectedElement = $(tinymce.activeEditor.selection.getNode())
      let blockQuote = this.create(getSuccessiveElementId(FIGURE_LISTING_SELECTOR, LISTING_SUFFIX))

      if (!selectedElement.parents('pre,code').length) {

        tinymce.activeEditor.undoManager.transact(function () {

          // Check if the selected paragraph is not empty, add the new listing right below
          if (selectedElement.text().trim().length != 0)
            selectedElement.after(blockQuote)

          // If selected paragraph is empty, replace it with the new table
          else
            selectedElement.replaceWith(blockQuote)

          // Save updates 
          tinymce.triggerSave()

          // Update all captions with RASH function
          captions()

          // Move the caret
          moveCaret(blockQuote[0])

          // Update Rendered RASH
          updateIframeFromSavedContent()
        })
      }
    },

    /**
     * 
     */
    create: function (id) {
      return $(`<blockquote><p>${ZERO_SPACE}</p></blockquote>`)
    },

    /**
     * 
     */
    getLastNotEmptyNode: function (nodes) {

      for (let i = 0; i < nodes.length; i++) {
        if ((nodes[i].nodeType == 3 || nodes[i].tagName == 'br') && !nodes[i].length)
          nodes.splice(i, 1)
      }

      return nodes[nodes.length - 1]
    },

    /**
     * 
     */
    addParagraph: function () {

      const BR = '<br>'

      // Get the references of the existing element
      let paragraph = $(tinymce.activeEditor.selection.getNode())

      // Placeholder text of the new li
      let text = BR
      let textNodes = paragraph.contents()

      // If there is just one node wrapped inside the paragraph
      if (textNodes.length == 1) {

        // Get the start offset and text of the current li
        let startOffset = tinymce.activeEditor.selection.getRng().startOffset
        let wholeText = paragraph.text()

        // If the cursor isn't at the end but it's in the middle
        // Get the remaining text from the cursor to the end
        if (startOffset != wholeText.length)
          text = wholeText.substring(startOffset, wholeText.length)

        tinymce.activeEditor.undoManager.transact(function () {

          // Update the text of the current li
          paragraph.text(wholeText.substring(0, startOffset))

          if (!paragraph.text().length)
            paragraph.html(BR)

          // Create and add the new li
          let newParagraph = $(`<p>${text}</p>`)
          paragraph.after(newParagraph)

          // Move the caret to the new li
          moveCaret(newParagraph[0], true)

          // Update the content
          tinymce.triggerSave()
        })
      }

      // Instead if there are multiple nodes inside the paragraph
      else {

        // Istantiate the range to be selected
        let range = document.createRange()

        // Start the range from the selected node and offset and ends it at the end of the last node
        range.setStart(tinymce.activeEditor.selection.getRng().startContainer, tinymce.activeEditor.selection.getRng().startOffset)
        range.setEnd(this.getLastNotEmptyNode(textNodes), 1)

        // Select the range
        tinymce.activeEditor.selection.setRng(range)

        // Save the html content
        wholeText = tinymce.activeEditor.selection.getContent()

        tinymce.activeEditor.undoManager.transact(function () {

          paragraph.html(paragraph.html().replace(wholeText, ''))

          if (!paragraph.text().length)
            paragraph.html(BR)

          // Create and add the new li
          let newParagraph = $(`<p>${wholeText}</p>`)
          paragraph.after(newParagraph)

          // Move the caret to the new li
          moveCaret(newParagraph[0], true)

          // Update the content
          tinymce.triggerSave()
        })
      }
    },

    /**
     * 
     */
    exit: function () {
      let paragraph = $(tinymce.activeEditor.selection.getNode())
      let blockquote = paragraph.parent()

      tinymce.activeEditor.undoManager.transact(function () {

        paragraph.remove()

        if (!blockquote.next().length) {
          blockquote.after($(`<p><br/></p>`))
        }

        moveCaret(blockquote.next()[0])

      })
    }
  }
})

/**
 * Update table captions with a RASH funcion 
 */
function captions() {

  /* Captions */
  $(figurebox_selector).each(function () {
    var cur_caption = $(this).parents("figure").find("figcaption");
    var cur_number = $(this).findNumber(figurebox_selector);
    cur_caption.find('strong').remove();
    cur_caption.html("<strong class=\"cgen\" data-rash-original-content=\"\" contenteditable=\"false\">Figure " + cur_number +
      ". </strong>" + cur_caption.html());
  });
  $(tablebox_selector).each(function () {
    var cur_caption = $(this).parents("figure").find("figcaption");
    var cur_number = $(this).findNumber(tablebox_selector);
    cur_caption.find('strong').remove();
    cur_caption.html("<strong class=\"cgen\" data-rash-original-content=\"\" contenteditable=\"false\" >Table " + cur_number +
      ". </strong>" + cur_caption.html());
  });
  $(formulabox_selector).each(function () {
    var cur_caption = $(this).parents("figure").find("p");
    var cur_number = $(this).findNumber(formulabox_selector);
    cur_caption.find('span.cgen').remove();
    cur_caption.html(cur_caption.html() + "<span contenteditable=\"false\" class=\"cgen\" data-rash-original-content=\"\" > (" +
      cur_number + ")</span>");
  });
  $(listingbox_selector).each(function () {
    var cur_caption = $(this).parents("figure").find("figcaption");
    var cur_number = $(this).findNumber(listingbox_selector);
    cur_caption.find('strong').remove();
    cur_caption.html("<strong class=\"cgen\" data-rash-original-content=\"\" contenteditable=\"false\">Listing " + cur_number +
      ". </strong>" + cur_caption.html());
  });
  /* /END Captions */
}

/**
 * 
 * @param {*} sel => tinymce selection
 * 
 * Mainly it checks where selection starts and ends to block unallowed deletion
 * In same figure aren't blocked, unless selection start OR end inside figcaption (not both)
 */
function handleFigureDelete(sel) {

  try {

    // Get reference of start and end node
    let startNode = $(sel.getRng().startContainer)
    let startNodeParent = startNode.parents(FIGURE_SELECTOR)

    let endNode = $(sel.getRng().endContainer)
    let endNodeParent = endNode.parents(FIGURE_SELECTOR)

    // If at least selection start or end is inside the figure
    if (startNodeParent.length || endNodeParent.length) {

      // If selection wraps entirely a figure from the start of first element (th in table) and selection ends
      if (endNode.parents('figcaption').length) {

        let contents = endNode.parent().contents()
        if (startNode.is(FIGURE_SELECTOR) && contents.index(endNode) == contents.length - 1 && sel.getRng().endOffset == endNode.text().length) {
          tinymce.activeEditor.undoManager.transact(function () {

            // Move cursor at the previous element and remove figure
            tinymce.activeEditor.focus()
            tinymce.activeEditor.selection.setCursorLocation(startNode.prev()[0], 1)
            startNode.remove()

            return false
          })
        }
      }

      // If selection doesn't start and end in the same figure, but one beetwen start or end is inside the figcaption, must block
      if (startNode.parents('figcaption').length != endNode.parents('figcaption').length && (startNode.parents('figcaption').length || endNode.parents('figcaption').length))
        return false

      // If the figure is not the same, must block
      // Because a selection can start in figureX and end in figureY
      if ((startNodeParent.attr('id') != endNodeParent.attr('id')))
        return false

      // If cursor is at start of code prevent
      if (startNode.parents(FIGURE_SELECTOR).find('pre').length) {

        // If at the start of pre>code, pressing 2times backspace will remove everything 
        if (startNode.parent().is('code') && (startNode.parent().contents().index(startNode) == 0 && sel.getRng().startOffset == 1)) {
          tinymce.activeEditor.undoManager.transact(function () {
            startNode.parents(FIGURE_SELECTOR).remove()
          })
          return false
        }


        if (startNode.parent().is('pre') && sel.getRng().startOffset == 0)
          return false
      }
    }

    return true
  } catch (e) {
    return false
  }
}

/**
 * 
 * @param {*} sel 
 */
function handleFigureCanc(sel) {

  // Get reference of start and end node
  let startNode = $(sel.getRng().startContainer)
  let startNodeParent = startNode.parents(FIGURE_SELECTOR)

  let endNode = $(sel.getRng().endContainer)
  let endNodeParent = endNode.parents(FIGURE_SELECTOR)

  // If at least selection start or end is inside the figure
  if (startNodeParent.length || endNodeParent.length) {

    // If selection doesn't start and end in the same figure, but one beetwen start or end is inside the figcaption, must block
    if (startNode.parents('figcaption').length != endNode.parents('figcaption').length && (startNode.parents('figcaption').length || endNode.parents('figcaption').length))
      return false

    // If the figure is not the same, must block
    // Because a selection can start in figureX and end in figureY
    if ((startNodeParent.attr('id') != endNodeParent.attr('id')))
      return false

  }

  // This algorithm doesn't work if caret is in empty text element

  // Current element can be or text or p
  let paragraph = startNode.is('p') ? startNode : startNode.parents('p').first()
  // Save all chldren nodes (text included)
  let paragraphContent = paragraph.contents()

  // If next there is a figure
  if (paragraph.next().is(FIGURE_SELECTOR)) {

    if (endNode[0].nodeType == 3) {

      // If the end node is a text inside a strong, its index will be -1.
      // In this case the editor must iterate until it face a inline element
      if (paragraphContent.index(endNode) == -1) //&& paragraph.parents(SECTION_SELECTOR).length)
        endNode = endNode.parent()

      // If index of the inline element is equal of children node length
      // AND the cursor is at the last position
      // Remove the next figure in one undo level
      if (paragraphContent.index(endNode) + 1 == paragraphContent.length && paragraphContent.last().text().length == sel.getRng().endOffset) {
        tinymce.activeEditor.undoManager.transact(function () {
          paragraph.next().remove()
        })
        return false
      }
    }
  }

  return true
}

/**
 * 
 * @param {*} sel => tinymce selection
 * 
 * Add a paragraph after the figure
 */
function handleFigureEnter(sel) {

  let selectedElement = $(sel.getNode())
  if (selectedElement.is('figcaption') || (selectedElement.parents(FIGURE_SELECTOR).length && selectedElement.is('p'))) {

    tinymce.activeEditor.undoManager.transact(function () {

      //add a new paragraph after the figure
      selectedElement.parent(FIGURE_SELECTOR).after('<p><br/></p>')

      //move caret at the start of new p
      tinymce.activeEditor.selection.setCursorLocation(selectedElement.parent(FIGURE_SELECTOR)[0].nextSibling, 0)
    })
    return false
  } else if (selectedElement.is('th'))
    return false
  return true
}

/**
 * 
 * @param {*} sel => tinymce selection
 */
function handleFigureChange(sel) {

  tinymce.triggerSave()

  // If rash-generated section is delete, re-add it
  if ($('figcaption:not(:has(strong))').length) {
    captions()
    updateIframeFromSavedContent()
  }
}
/**
 * raje_inline_code plugin RAJE
 */

const DISABLE_SELECTOR_INLINE = 'table, img, pre, code, section[role=doc-bibliography]'

const INLINE_ERRORS = 'Error, Inline elements can be ONLY created inside the same paragraph'

/**
 * 
 */
let inline = {

  /**
   * 
   */
  handle: function (type) {
    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    // If there isn't any inline code
    if (!selectedElement.is(type) && !selectedElement.parents(type).length) {

      let text = ZERO_SPACE

      // Check if the selection starts and ends in the same paragraph
      if (!tinymce.activeEditor.selection.isCollapsed()) {

        let startNode = tinymce.activeEditor.selection.getStart()
        let endNode = tinymce.activeEditor.selection.getEnd()

        // Notify the error and exit
        if (startNode != endNode) {
          notify(INLINE_ERRORS, 'error', 3000)
          return false
        }

        // Save the selected content as text
        text += tinymce.activeEditor.selection.getContent()
      }

      // Update the current selection with code element
      tinymce.activeEditor.undoManager.transact(function () {

        // Get the index of the current selected node
        let previousNodeIndex = selectedElement.contents().index($(tinymce.activeEditor.selection.getRng().startContainer))

        // Add code element
        tinymce.activeEditor.selection.setContent(`<${type}>${text}</${type}>${(type == 'q' ? ZERO_SPACE : '')}`)
        tinymce.triggerSave()

        // Move caret at the end of the successive node of previous selected node
        tinymce.activeEditor.selection.setCursorLocation(selectedElement.contents()[previousNodeIndex + 1], 1)
      })
    }
  },

  /**
   * 
   */
  exit: function () {
    // Get the current node index, relative to its parent
    let selectedElement = $(tinymce.activeEditor.selection.getNode())
    let parentContent = selectedElement.parent().contents()
    let index = parentContent.index(selectedElement)

    tinymce.activeEditor.undoManager.transact(function () {

      // Check if the current node has a text after
      if (typeof parentContent[index + 1] != 'undefined' && $(parentContent[index + 1]).is('text')) {
        tinymce.activeEditor.selection.setCursorLocation(parentContent[index + 1], 0)
        tinymce.activeEditor.selection.setContent(ZERO_SPACE)
      }

      // If the node hasn't text after, raje has to add it
      else {
        selectedElement.after(ZERO_SPACE)
        tinymce.activeEditor.selection.setCursorLocation(parentContent[index + 1], 0)
      }
    })
  },

  /**
   * 
   */
  replaceText: function (char) {

    let selectedElement = $(tinymce.activeEditor.selection.getNode())
    tinymce.activeEditor.undoManager.transact(function () {

      // Set the new char and overwrite current text
      selectedElement.html(char)

      // Move the caret at the end of current text
      let content = selectedElement.contents()
      moveCaret(content[content.length - 1])
    })
  }
}

/**
 * 
 */
tinymce.PluginManager.add('raje_inlineCode', function (editor, url) {

  const CODE = 'code'

  // Add a button that opens a window
  editor.addButton('raje_inlineCode', {
    title: 'inline_code',
    icon: 'icon-inline-code',
    tooltip: 'Inline code',
    disabledStateSelector: DISABLE_SELECTOR_INLINE,

    // Button behaviour
    onclick: function () {
      inline.handle(CODE)
    }
  })

  editor.on('keyDown', function (e) {

    // Check if the selected element is a CODE that isn't inside a FIGURE or PRE
    let selectedElement = $(tinymce.activeEditor.selection.getNode())
    if (selectedElement.is('code') && !selectedElement.parents(FIGURE_SELECTOR).length && !selectedElement.parents('pre').length) {

      /**
       * Check if ENTER is pressed
       */
      if (e.keyCode == 13) {

        e.preventDefault()
        e.stopImmediatePropagation()
        inline.exit()
      }

      /**
       * Check if a PRINTABLE CHAR is pressed
       */
      if (checkIfPrintableChar(e.keyCode)) {

        // If the first char is ZERO_SPACE and the code has no char
        if (selectedElement.text().length == 2 && `&#${selectedElement.text().charCodeAt(0)};` == ZERO_SPACE) {
          
          e.preventDefault()
          e.stopImmediatePropagation()
          inline.replaceText(e.key)
        }
      }
    }
  })
})

/**
 *  Inline quote plugin RAJE
 */
tinymce.PluginManager.add('raje_inlineQuote', function (editor, url) {

  const Q = 'q'

  // Add a button that handle the inline element
  editor.addButton('raje_inlineQuote', {
    title: 'inline_quote',
    icon: 'icon-inline-quote',
    tooltip: 'Inline quote',
    disabledStateSelector: DISABLE_SELECTOR_INLINE,

    // Button behaviour
    onclick: function () {
      inline.handle('q')
    }
  })

  editor.on('keyDown', function (e) {

    // Check if the selected element is a CODE that isn't inside a FIGURE or PRE
    let selectedElement = $(tinymce.activeEditor.selection.getNode())
    if (selectedElement.is('q')) {

      /**
       * Check if ENTER is pressed
       */
      if (e.keyCode == 13) {

        e.preventDefault()
        e.stopImmediatePropagation()
        inline.exit()
      }

      /**
       * Check if a PRINTABLE CHAR is pressed
       */
      if (checkIfPrintableChar(e.keyCode)) {

        // If the first char is ZERO_SPACE and the code has no char
        if (selectedElement.text().length == 1 && `&#${selectedElement.text().charCodeAt(0)};` == ZERO_SPACE) {

          e.preventDefault()
          e.stopImmediatePropagation()
          inline.replaceText(e.key)
        }
      }
    }
  })
})

/**
 * 
 */
tinymce.PluginManager.add('raje_externalLink', function (editor, url) {

  editor.addButton('raje_externalLink', {
    title: 'external_link',
    icon: 'icon-external-link',
    tooltip: 'External link',
    disabledStateSelector: DISABLE_SELECTOR_INLINE,

    // Button behaviour
    onclick: function () {}
  })


  let link = {
    add: function () {

    }
  }
})

/**
 * 
 */
tinymce.PluginManager.add('raje_inlineFigure', function (editor, url) {
  editor.addButton('raje_inlineFigure', {
    text: 'inline_figure',
    tooltip: 'Inline quote',
    disabledStateSelector: DISABLE_SELECTOR_INLINE,

    // Button behaviour
    onclick: function () {}
  })
})
tinymce.PluginManager.add('raje_lists', function (editor, url) {

  const OL = 'ol'
  const UL = 'ul'

  editor.addButton('raje_ol', {
    title: 'raje_ol',
    icon: 'icon-ol',
    tooltip: 'Ordered list',
    disabledStateSelector: DISABLE_SELECTOR_FIGURES,

    // Button behaviour
    onclick: function () {
      list.add(OL)
    }
  })

  editor.addButton('raje_ul', {
    title: 'raje_ul',
    icon: 'icon-ul',
    tooltip: 'Unordered list',
    disabledStateSelector: DISABLE_SELECTOR_FIGURES,

    // Button behaviour
    onclick: function () {
      list.add(UL)
    }
  })

  /**
   * 
   */
  editor.on('keyDown', function (e) {


    // Check if the selected element is a P inside a list (OL, UL)
    let selectedElement = $(tinymce.activeEditor.selection.getNode())
    if (selectedElement.is('p') && (selectedElement.parents('ul').length || selectedElement.parents('li').length)) {


      /**
       * Check if CMD+ENTER or CTRL+ENTER are pressed
       */
      if ((e.metaKey || e.ctrlKey) && e.keyCode == 13) {
        e.preventDefault()
        list.addParagraph()
      }

      /**
       * Check if SHIFT+TAB is pressed
       */
      else if (e.shiftKey && e.keyCode == 9) {
        e.preventDefault()
        list.deNest()
      }

      /**
       * Check if ENTER is pressed
       */
      else if (e.keyCode == 13) {

        e.preventDefault()

        // Check if the selection is collapsed
        if (tinymce.activeEditor.selection.isCollapsed()) {

          if (!selectedElement.text().trim().length) {

            // De nest
            if (selectedElement.parents('ul,ol').length > 1)
              list.deNest()

            // Remove the empty LI
            else
              list.removeListItem()

          } else
            list.addListItem()
        }
      }

      /**
       * Check if TAB is pressed
       */
      else if (e.keyCode == 9) {
        e.preventDefault()
        list.nest()
      }
    }
  })


  /**
   * 
   */
  let list = {

    /**
     * 
     */
    add: function (type) {

      // Get the current element 
      let selectedElement = $(tinymce.activeEditor.selection.getNode())
      let text = '<br>'

      // If the current element has text, save it
      if (selectedElement.text().trim().length > 0)
        text = selectedElement.text().trim()

      tinymce.activeEditor.undoManager.transact(function () {

        let newList = $(`<${type}><li><p>${text}</p></li></${type}>`)

        // Add the new element
        selectedElement.replaceWith(newList)

        // Save changes
        tinymce.triggerSave()

        // Move the cursor
        moveCaret(newList.find('p')[0], false)
      })
    },

    /**
     * 
     */
    addListItem: function () {

      const BR = '<br>'

      // Get the references of the existing element
      let p = $(tinymce.activeEditor.selection.getNode())
      let listItem = p.parent('li')

      // Placeholder text of the new li
      let newText = BR
      let nodes = p.contents()

      // If there is just one node wrapped inside the paragraph
      if (nodes.length == 1) {

        // Get the start offset and text of the current li
        let startOffset = tinymce.activeEditor.selection.getRng().startOffset
        let pText = p.text()

        // If the cursor isn't at the end
        if (startOffset != pText.length) {

          // Get the remaining text
          newText = pText.substring(startOffset, pText.length)
        }

        tinymce.activeEditor.undoManager.transact(function () {

          // Update the text of the current li
          p.text(pText.substring(0, startOffset))

          if (!p.text().length)
            p.html(BR)

          // Create and add the new li
          let newListItem = $(`<li><p>${newText}</p></li>`)
          listItem.after(newListItem)

          // Move the caret to the new li
          moveCaret(newListItem[0], true)

          // Update the content
          tinymce.triggerSave()
        })
      }

      // Instead if there are multiple nodes inside the paragraph
      else {

        // Istantiate the range to be selected
        let range = document.createRange()

        // Start the range from the selected node and offset and ends it at the end of the last node
        range.setStart(tinymce.activeEditor.selection.getRng().startContainer, tinymce.activeEditor.selection.getRng().startOffset)
        range.setEnd(this.getLastNotEmptyNode(nodes), 1)

        // Select the range
        tinymce.activeEditor.selection.setRng(range)

        // Save the html content
        newText = tinymce.activeEditor.selection.getContent()

        tinymce.activeEditor.undoManager.transact(function () {

          p.html(p.html().replace(newText, ''))

          if (!p.text().length)
            p.html(BR)

          // Create and add the new li
          let newListItem = $(`<li><p>${newText}</p></li>`)
          listItem.after(newListItem)

          // Move the caret to the new li
          moveCaret(newListItem[0], true)

          // Update the content
          tinymce.triggerSave()
        })
      }
    },

    /**
     * 
     */
    getLastNotEmptyNode: function (nodes) {

      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].nodeType == 3 && !nodes[i].length)
          nodes.splice(i, 1)
      }

      return nodes[nodes.length - 1]
    },

    /**
     * 
     */
    removeListItem: function () {

      // Get the selected listItem
      let listItem = $(tinymce.activeEditor.selection.getNode()).parent('li')

      tinymce.activeEditor.undoManager.transact(function () {

        // Add a empty paragraph after the list
        let newP = $('<p><br></p>')
        listItem.parent().after(newP)

        // Check if the list has exactly one child remove the list
        if (listItem.parent().children('li').length == 1) {
          let list = listItem.parent()
          list.remove()
        }

        // If the list has more children remove the selected child
        else
          listItem.remove()

        moveCaret(newP[0])

        // Update the content
        tinymce.triggerSave()
      })
    },

    /**
     * 
     */
    nest: function () {

      let p = $(tinymce.activeEditor.selection.getNode())
      let listItem = p.parent('li')

      // Check if the current li has at least one previous element
      if (listItem.prevAll().length > 0) {

        // Create the new list
        let text = '<br>'

        if (p.text().trim().length)
          text = p.text().trim()

        // Get type of the parent list
        let type = listItem.parent()[0].tagName.toLowerCase()

        // Create the new nested list
        let newListItem = $(listItem[0].outerHTML)

        tinymce.activeEditor.undoManager.transact(function () {

          // If the previous element has a list
          if (listItem.prev().find('ul,ol').length)
            listItem.prev().find('ul,ol').append(newListItem)

          // Add the new list inside the previous li
          else {
            newListItem = $(`<${type}>${newListItem[0].outerHTML}</${type}>`)
            listItem.prev().append(newListItem)
          }

          listItem.remove()

          // Move the caret at the end of the new p 
          moveCaret(newListItem.find('p')[0])

          tinymce.triggerSave()
        })
      }
    },

    /**
     * 
     */
    deNest: function () {

      let listItem = $(tinymce.activeEditor.selection.getNode()).parent('li')
      let list = listItem.parent()

      // Check if the current list has at least another list as parent
      if (listItem.parents('ul,ol').length > 1) {

        tinymce.activeEditor.undoManager.transact(function () {

          // Get all li: current and if there are successive
          let nextLi = [listItem]
          if (listItem.nextAll().length > 0) {
            listItem.nextAll().each(function () {
              nextLi.push($(this))
            })
          }

          // Move all li out from the nested list
          for (let i = nextLi.length - 1; i > -1; i--) {
            nextLi[i].remove()
            list.parent().after(nextLi[i])
          }

          // If empty remove the list
          if (!list.children('li').length)
            list.remove()

          // Move the caret at the end
          moveCaret(listItem.find('p')[0])
        })
      }
    },

    /**
     * 
     */
    addParagraph: function () {

      // Get references of current p
      let p = $(tinymce.activeEditor.selection.getNode())
      let startOffset = tinymce.activeEditor.selection.getRng().startOffset
      let pText = p.text().trim()

      let text = '<br>'

      tinymce.activeEditor.undoManager.transact(function () {

        // If the ENTER breaks p
        if (startOffset != pText.length) {

          // Update the text of the current li
          p.text(pText.substring(0, startOffset))

          // Get the remaining text
          text = pText.substring(startOffset, pText.length)
        }

        // Create and add the element
        let newP = $(`<p>${text}</p>`)
        p.after(newP)

        moveCaret(newP[0], true)
      })
    }
  }
})
/**
 * 
 */

function openMetadataDialog() {
  tinymce.activeEditor.windowManager.open({
    title: 'Edit metadata',
    url: 'js/raje-core/plugin/raje_metadata.html',
    width: 950,
    height: 800,
    onClose: function () {

      if (tinymce.activeEditor.updated_metadata != null) {

        metadata.update(tinymce.activeEditor.updated_metadata)

        tinymce.activeEditor.updated_metadata == null
      }

      tinymce.activeEditor.windowManager.close()
    }
  }, metadata.getAllMetadata())
}

tinymce.PluginManager.add('raje_metadata', function (editor, url) {

  // Add a button that handle the inline element
  editor.addButton('raje_metadata', {
    text: 'Metadata',
    icon: false,
    tooltip: 'Edit metadata',

    // Button behaviour
    onclick: function () {
      openMetadataDialog()
    }
  })

  editor.on('click', function (e) {
    if ($(tinymce.activeEditor.selection.getNode()).is(HEADER_SELECTOR))
      openMetadataDialog()
  })

  metadata = {

    /**
     * 
     */
    getAllMetadata: function () {
      let header = $(HEADER_SELECTOR)
      let subtitle = header.find('h1.title > small').text()
      let data = {
        subtitle: subtitle,
        title: header.find('h1.title').text().replace(subtitle, ''),
        authors: metadata.getAuthors(header),
        categories: metadata.getCategories(header),
        keywords: metadata.getKeywords(header)
      }

      return data
    },

    /**
     * 
     */
    getAuthors: function (header) {
      let authors = []

      header.find('address.lead.authors').each(function () {

        // Get all affiliations
        let affiliations = []
        $(this).find('span').each(function () {
          affiliations.push($(this).text())
        })

        // push single author
        authors.push({
          name: $(this).children('strong.author_name').text(),
          email: $(this).find('code.email > a').text(),
          affiliations: affiliations
        })
      })

      return authors
    },

    /**
     * 
     */
    getCategories: function (header) {
      let categories = []

      header.find('p.acm_subject_categories > code').each(function () {
        categories.push($(this).text())
      })

      return categories
    },

    /**
     * 
     */
    getKeywords: function (header) {
      let keywords = []

      header.find('ul.list-inline > li > code').each(function () {
        keywords.push($(this).text())
      })

      return keywords
    },

    /**
     * 
     */
    update: function (updatedMetadata) {

      $('head meta[property], head link[property], head meta[name]').remove()

      let currentMetadata = metadata.getAllMetadata()

      // Update title and subtitle
      if (updatedMetadata.title != currentMetadata.title || updatedMetadata.subtitle != currentMetadata.subtitle) {
        let text = updatedMetadata.title

        if (updatedMetadata.subtitle.trim().length)
          text += ` -- ${updatedMetadata.subtitle}`

        $('title').text(text)
      }

      let affiliationsCache = []

      updatedMetadata.authors.forEach(function (author) {

        $('head').append(`<meta about="mailto:${author.email}" typeof="schema:Person" property="schema:name" name="dc.creator" content="${author.name}">`)
        $('head').append(`<meta about="mailto:${author.email}" property="schema:email" content="${author.email}">`)

        author.affiliations.forEach(function (affiliation) {

          // Look up for already existing affiliation
          let toAdd = true
          let id

          affiliationsCache.forEach(function (affiliationCache) {
            if (affiliationCache.content == affiliation) {
              toAdd = false
              id = affiliationCache.id
            }
          })

          // If there is no existing affiliation, add it
          if (toAdd) {
            let generatedId = `#affiliation_${affiliationsCache.length+1}`
            affiliationsCache.push({
              id: generatedId,
              content: affiliation
            })
            id = generatedId
          }

          $('head').append(`<link about="mailto:${author.email}" property="schema:affiliation" href="${id}">`)
        })
      })

      affiliationsCache.forEach(function (affiliationCache) {
        $('head').append(`<meta about="${affiliationCache.id}" typeof="schema:Organization" property="schema:name" content="${affiliationCache.content}">`)
      })

      updatedMetadata.categories.forEach(function(category){
        $('head').append(`<meta name="dcterms.subject" content="${category}"/>`)
      })

      updatedMetadata.keywords.forEach(function(keyword){
        $('head').append(`<meta property="prism:keyword" content="${keyword}"/>`)
      })

      $('#raje_root').addHeaderHTML()
      setNonEditableHeader()
      updateIframeFromSavedContent()
    }
  }

})
tinymce.PluginManager.add('raje_save', function (editor, url) {

  saveManager = {

    /**
     * 
     */
    initSave: function () {
      // Return the message for the backend
      return {
        title: saveManager.getTitle(),
        document: saveManager.getDerashedArticle()
      }
    },

    /**
     * 
     */
    saveAs: function () {

      // Send message to the backend
      saveAsArticle(saveManager.initSave())
    },

    /**
     * 
     */
    save: function () {

      // Send message to the backend
      saveArticle(saveManager.initSave())
    },

    /**
     * Return the RASH article rendered (without tinymce)
     */
    getDerashedArticle: function () {

      // Save html references
      let article = $('html').clone()
      let tinymceSavedContent = article.find('#raje_root')

      article.removeAttr('class')

      //replace body with the right one (this action remove tinymce)
      article.find('body').html(tinymceSavedContent.html())
      article.find('body').removeAttr('style')
      article.find('body').removeAttr('class')

      //remove all style and link un-needed from the head
      article.find('head').children('style[type="text/css"]').remove()
      article.find('head').children('link[id]').remove()

      // Execute derash (replace all cgen elements with its original content)
      article.find('*[data-rash-original-content]').each(function () {
        let originalContent = $(this).attr('data-rash-original-content')
        $(this).replaceWith(originalContent)
      })

      // Execute derash changing the wrapper
      article.find('*[data-rash-original-wrapper]').each(function () {
        let content = $(this).html()
        let wrapper = $(this).attr('data-rash-original-wrapper')
        $(this).replaceWith(`<${wrapper}>${content}</${wrapper}>`)
      })

      // Remove target from TinyMCE link
      article.find('a[target]').each(function () {
        $(this).removeAttr('target')
      })

      // Remove contenteditable from TinyMCE link
      article.find('a[contenteditable]').each(function () {
        $(this).removeAttr('contenteditable')
      })

      // Remove not allowed span elments inside the formula
      article.find(FIGURE_FORMULA_SELECTOR).each(function () {
        $(this).children('p').html($(this).find('span[contenteditable]').html())
      })

      article.find(`${FIGURE_FORMULA_SELECTOR},${INLINE_FORMULA_SELECTOR}`).each(function () {
        if ($(this).find('svg[data-mathml]').length) {
          $(this).children('p').html($(this).find('svg[data-mathml]').attr('data-mathml'))
        }
      })

      return new XMLSerializer().serializeToString(article[0])
    },

    /**
     * Return the title 
     */
    getTitle: function () {
      return $('title').text()
    },

  }
})
/**
 * RASH section plugin RAJE
 */

const NON_EDITABLE_HEADER_SELECTOR = 'header.page-header.container.cgen'
const BIBLIOENTRY_SUFFIX = 'biblioentry_'
const ENDNOTE_SUFFIX = 'endnote_'

const BIBLIOGRAPHY_SELECTOR = 'section[role=doc-bibliography]'
const BIBLIOENTRY_SELECTOR = 'li[role=doc-biblioentry]'

const ENDNOTES_SELECTOR = 'section[role=doc-endnotes]'
const ENDNOTE_SELECTOR = 'section[role=doc-endnote]'

const ABSTRACT_SELECTOR = 'section[role=doc-abstract]'
const ACKNOWLEDGEMENTS_SELECTOR = 'section[role=doc-acknowledgements]'

const MAIN_SECTION_SELECTOR = 'div#raje_root > section:not([role])'
const SECTION_SELECTOR = 'section:not([role])'
const SPECIAL_SECTION_SELECTOR = 'section[role]'

const MENU_SELECTOR = 'div[id^=mceu_][id$=-body][role=menu]'

const DATA_UPGRADE = 'data-upgrade'
const DATA_DOWNGRADE = 'data-downgrade'

const HEADING = 'Heading'

const HEADING_TRASFORMATION_FORBIDDEN = 'Error, you cannot transform the current header in this way!'

tinymce.PluginManager.add('raje_section', function (editor, url) {

  let raje_section_flag = false
  let raje_stored_selection

  editor.addButton('raje_section', {
    type: 'menubutton',
    text: 'Headings',
    title: 'heading',
    icons: false,

    // Sections sub menu
    menu: [{
      text: `${HEADING} 1.`,
      onclick: function (e) {
        section.addOrDownUpgrade(e, 1)
      }
    }, {
      text: `${HEADING} 1.1.`,
      onclick: function (e) {
        section.addOrDownUpgrade(e, 2)
      }
    }, {
      text: `${HEADING} 1.1.1.`,
      onclick: function (e) {
        section.addOrDownUpgrade(e, 3)
      }
    }, {
      text: `${HEADING} 1.1.1.1.`,
      onclick: function (e) {
        section.addOrDownUpgrade(e, 4)
      }
    }, {
      text: `${HEADING} 1.1.1.1.1.`,
      onclick: function (e) {
        section.addOrDownUpgrade(e, 5)
      }
    }, {
      text: `${HEADING} 1.1.1.1.1.1.`,
      onclick: function (e) {
        section.addOrDownUpgrade(e, 6)
      }
    }, {
      text: 'Special',
      menu: [{
          text: 'Abstract',
          onclick: function () {

            section.addAbstract()
          }
        },
        {
          text: 'Acknowledgements',
          onclick: function () {
            section.addAcknowledgements()
          }
        },
        {
          text: 'References',
          onclick: function () {

            tinymce.triggerSave()

            // Only if bibliography section doesn't exists
            if (!$(BIBLIOGRAPHY_SELECTOR).length) {

              // TODO change here
              tinymce.activeEditor.undoManager.transact(function () {
                // Add new biblioentry
                section.addBiblioentry()

                // Update iframe
                updateIframeFromSavedContent()

                //move caret and set focus to active aditor #105
                tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select(`${BIBLIOENTRY_SELECTOR}:last-child`)[0], true)
              })
            } else
              tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select(`${BIBLIOGRAPHY_SELECTOR}>h1`)[0])

            scrollTo(`${BIBLIOENTRY_SELECTOR}:last-child`)

            tinymce.activeEditor.focus()
          }
        }
      ]
    }]
  })

  editor.on('keyDown', function (e) {

    // instance of the selected element
    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    try {

      let keycode = e.keyCode

      // Save bounds of current selection (start and end)
      let startNode = $(tinymce.activeEditor.selection.getRng().startContainer)
      let endNode = $(tinymce.activeEditor.selection.getRng().endContainer)

      const SPECIAL_CHARS =
        (keycode > 47 && keycode < 58) || // number keys
        (keycode > 95 && keycode < 112) || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223); // [\]' (in order)

      // Block special chars in special elements
      if (SPECIAL_CHARS &&
        (startNode.parents(SPECIAL_SECTION_SELECTOR).length || endNode.parents(SPECIAL_SECTION_SELECTOR).length) &&
        (startNode.parents('h1').length > 0 || endNode.parents('h1').length > 0))
        return false

      // #################################
      // ### BACKSPACE && CANC PRESSED ###
      // #################################
      if (e.keyCode == 8 || e.keyCode == 46) {

        //let toRemoveSections = section.getSectionsinSelection(tinymce.activeEditor.selection)
        raje_section_flag = true

        // Prevent remove from header
        if (selectedElement.is(NON_EDITABLE_HEADER_SELECTOR) ||
          (selectedElement.attr('data-mce-caret') == 'after' && selectedElement.parent().is(RAJE_SELECTOR)) ||
          (selectedElement.attr('data-mce-caret') && selectedElement.parent().is(RAJE_SELECTOR)) == 'before')
          return false

        // If selection isn't collapsed manage delete
        if (!tinymce.activeEditor.selection.isCollapsed()) {
          return section.manageDelete()
        }

        // If SELECTION STARTS or ENDS in special section
        else if (startNode.parents(SPECIAL_SECTION_SELECTOR).length || endNode.parents(SPECIAL_SECTION_SELECTOR).length) {

          let startOffset = tinymce.activeEditor.selection.getRng().startOffset
          let startOffsetNode = 0
          let endOffset = tinymce.activeEditor.selection.getRng().endOffset
          let endOffsetNode = tinymce.activeEditor.selection.getRng().endContainer.length

          // Completely remove the current special section if is entirely selected
          if (
            // Check if the selection contains the entire section
            startOffset == startOffsetNode && endOffset == endOffsetNode &&

            // Check if the selection starts from h1
            (startNode.parents('h1').length != endNode.parents('h1').length) && (startNode.parents('h1').length || endNode.parents('h1').length) &&

            // Check if the selection ends in the last child
            (startNode.parents(SPECIAL_SECTION_SELECTOR).children().length == $(tinymce.activeEditor.selection.getRng().endContainer).parentsUntil(SPECIAL_SECTION_SELECTOR).index() + 1)) {

          }

          // Remove the current special section if selection is at the start of h1 AND selection is collapsed 
          if (tinymce.activeEditor.selection.isCollapsed() && (startNode.parents('h1').length || startNode.is('h1')) && startOffset == 0) {

            tinymce.activeEditor.undoManager.transact(function () {

              // Remove the section and update 
              selectedElement.parent(SPECIAL_SECTION_SELECTOR).remove()
              tinymce.triggerSave()

              // Update references
              updateReferences()
              updateIframeFromSavedContent()
            })

            return false
          }

          // Chek if inside the selection to remove, there is bibliography
          let hasBibliography = false
          $(tinymce.activeEditor.selection.getContent()).each(function () {
            if ($(this).is(BIBLIOGRAPHY_SELECTOR))
              hasBibliography = true
          })

          if (hasBibliography) {

            tinymce.activeEditor.undoManager.transact(function () {

              // Execute normal delete
              tinymce.activeEditor.execCommand('delete')

              // Update saved content
              tinymce.triggerSave()

              // Remove selector without hader
              $(BIBLIOGRAPHY_SELECTOR).remove()

              // Update iframe and restore selection
              updateIframeFromSavedContent()
            })

            return false
          }

          // if selection starts or ends in a biblioentry
          if (startNode.parents(BIBLIOENTRY_SELECTOR).length || endNode.parents(BIBLIOENTRY_SELECTOR).length) {

            // Both delete event and update are stored in a single undo level
            tinymce.activeEditor.undoManager.transact(function () {

              tinymce.activeEditor.execCommand('delete')
              section.updateBibliographySection()
              updateReferences()

              // update iframe
              updateIframeFromSavedContent()
            })

            return false
          }
        }


      }
    } catch (exception) {}

    // #################################
    // ######### ENTER PRESSED #########
    // #################################
    if (e.keyCode == 13) {

      // When enter is pressed inside an header, not at the end of it
      if (selectedElement.is('h1,h2,h3,h4,h5,h6') && selectedElement.text().trim().length != tinymce.activeEditor.selection.getRng().startOffset) {

        section.addWithEnter()
        return false
      }

      // If selection is before/after header
      if (selectedElement.is('p')) {

        // Block enter before header
        if (selectedElement.attr('data-mce-caret') == 'before')
          return false


        // Add new section after header
        if (selectedElement.attr('data-mce-caret') == 'after') {
          section.add(1)
          return false
        }
      }

      // If enter is pressed inside bibliography selector
      if (selectedElement.parents(BIBLIOGRAPHY_SELECTOR).length) {

        tinymce.triggerSave()

        let id = getSuccessiveElementId(BIBLIOENTRY_SELECTOR, BIBLIOENTRY_SUFFIX)

        // Pressing enter in h1 will add a new biblioentry and caret reposition
        if (selectedElement.is('h1')) {

          section.addBiblioentry(id)
          updateIframeFromSavedContent()
        }

        // If selected element is inside text
        else if (selectedElement.is('p'))
          section.addBiblioentry(id, null, selectedElement.parent('li'))


        // If selected element is without text
        else if (selectedElement.is('li'))
          section.addBiblioentry(id, null, selectedElement)

        // Move caret #105
        tinymce.activeEditor.selection.setCursorLocation(tinymce.activeEditor.dom.select(`${BIBLIOENTRY_SELECTOR}#${id} > p`)[0], false)
        return false
      }

      // Adding sections with shortcuts #
      if (selectedElement.is('p') && selectedElement.text().trim().substring(0, 1) == '#') {

        let level = section.getLevelFromHash(selectedElement.text().trim())
        let deepness = $(selectedElement).parentsUntil(RAJE_SELECTOR).length - level + 1

        // Insert section only if caret is inside abstract section, and user is going to insert a sub section
        // OR the cursor isn't inside other special sections
        // AND selectedElement isn't inside a figure
        if (((selectedElement.parents(ABSTRACT_SELECTOR).length && deepness > 0) || !selectedElement.parents(SPECIAL_SECTION_SELECTOR).length) && !selectedElement.parents(FIGURE_SELECTOR).length) {

          section.add(level, selectedElement.text().substring(level).trim())
          return false
        }
      }
    }
  })

  editor.on('NodeChange', function (e) {
    section.updateSectionToolbar()
  })
})

section = {

  /**
   * Function called when a new section needs to be attached, with buttons
   */
  add: function (level, text) {

    // Select current node
    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    // Create the section
    let newSection = this.create(text != null ? text : selectedElement.html().trim(), level)

    tinymce.activeEditor.undoManager.transact(function () {

      // Check what kind of section needs to be inserted
      if (section.manageSection(selectedElement, newSection, level ? level : selectedElement.parentsUntil(RAJE_SELECTOR).length)) {

        // Remove the selected section
        selectedElement.remove()

        // If the new heading has text nodes, the offset won't be 0 (as normal) but instead it'll be length of node text
        moveCaret(newSection.find(':header').first()[0])

        // Update editor content
        tinymce.triggerSave()
      }
    })
  },

  /**
   * 
   */
  addOrDownUpgrade: function (e, level) {

    let selectedMenuItem = $(e.target).parent('.mce-menu-item')

    if (selectedMenuItem.attr(DATA_UPGRADE))
      return this.upgrade()

    if (selectedMenuItem.attr(DATA_DOWNGRADE))
      return this.downgrade()

    return this.add(level)
  },

  /**
   * Function called when a new section needs to be attached, with buttons
   */
  addWithEnter: function () {

    // Select current node
    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    // If the section isn't special
    if (!selectedElement.parent().attr('role')) {

      level = selectedElement.parentsUntil(RAJE_SELECTOR).length

      // Create the section
      let newSection = this.create(selectedElement.text().trim().substring(tinymce.activeEditor.selection.getRng().startOffset), level)

      tinymce.activeEditor.undoManager.transact(function () {

        // Check what kind of section needs to be inserted
        section.manageSection(selectedElement, newSection, level)

        // Remove the selected section
        selectedElement.html(selectedElement.text().trim().substring(0, tinymce.activeEditor.selection.getRng().startOffset))

        moveCaret(newSection.find(':header').first()[0], true)

        // Update editor
        tinymce.triggerSave()
      })
    } else
      notify('Error, headers of special sections (abstract, acknowledments) cannot be splitted', 'error', 4000)
  },

  /**
   * Get the last inserted id
   */
  getNextId: function () {
    let id = 0
    $('section[id]').each(function () {
      if ($(this).attr('id').indexOf('section') > -1) {
        let currId = parseInt($(this).attr('id').replace('section', ''))
        id = id > currId ? id : currId
      }
    })
    return `section${id+1}`
  },

  /**
   * Retrieve and then remove every successive elements 
   */
  getSuccessiveElements: function (element, deepness) {

    let successiveElements = $('<div></div>')

    while (deepness >= 0) {

      if (element.nextAll(':not(.footer)')) {

        // If the deepness is 0, only paragraph are saved (not sections)
        if (deepness == 0) {
          // Successive elements can be p or figures
          successiveElements.append(element.nextAll(`p,${FIGURE_SELECTOR}`))
          element.nextAll().remove(`p,${FIGURE_SELECTOR}`)
        } else {
          successiveElements.append(element.nextAll())
          element.nextAll().remove()
        }
      }

      element = element.parent('section')
      deepness--
    }

    return $(successiveElements.html())
  },

  /**
   * 
   */
  getLevelFromHash: function (text) {

    let level = 0
    text = text.substring(0, text.length >= 6 ? 6 : text.length)

    while (text.length > 0) {

      if (text.substring(text.length - 1) == '#')
        level++

        text = text.substring(0, text.length - 1)
    }

    return level
  },

  /**
   * Return JQeury object that represent the section
   */
  create: function (text, level) {
    // Create the section

    // Trim white spaces and add zero_space char if nothing is inside

    if (typeof text != "undefined") {
      text = text.trim()
      if (text.length == 0)
        text = "<br>"
    } else
      text = "<br>"

    return $(`<section id="${this.getNextId()}"><h${level} data-rash-original-wrapper="h1">${text}</h${level}></section>`)
  },

  /**
   * Check what kind of section needs to be added, and preceed
   */
  manageSection: function (selectedElement, newSection, level) {

    let deepness = $(selectedElement).parentsUntil(RAJE_SELECTOR).length - level + 1

    if (deepness >= 0) {

      // Block insert selection if caret is inside special section, and user is going to insert a sub section
      if ((selectedElement.parents(SPECIAL_SECTION_SELECTOR).length && deepness != 1) || (selectedElement.parents(ACKNOWLEDGEMENTS_SELECTOR).length &&
          selectedElement.parents(BIBLIOGRAPHY_SELECTOR) &&
          selectedElement.parents(ENDNOTES_SELECTOR)))
        return false

      // Get direct parent and ancestor reference
      let successiveElements = this.getSuccessiveElements(selectedElement, deepness)

      if (successiveElements.length)
        newSection.append(successiveElements)

      // CASE: sub section
      if (deepness == 0)
        selectedElement.after(newSection)

      // CASE: sibling section
      else if (deepness == 1)
        selectedElement.parent('section').after(newSection)

      // CASE: ancestor section at any uplevel
      else
        $(selectedElement.parents('section')[deepness - 1]).after(newSection)

      headingDimension()

      return true
    }
  },

  /**
   * 
   */
  upgrade: function () {

    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    if (selectedElement.is(':header')) {

      // Get the references of selected and parent section
      let selectedSection = selectedElement.parent(SECTION_SELECTOR)
      let parentSection = selectedSection.parent(SECTION_SELECTOR)

      // If there is a parent section upgrade is allowed
      if (parentSection.length) {

        // Everything in here, is an atomic undo level
        tinymce.activeEditor.undoManager.transact(function () {

          // Save the section and detach
          let bodySection = $(selectedSection[0].outerHTML)
          selectedSection.detach()

          // Update dimension and move the section out
          parentSection.after(bodySection)

          tinymce.triggerSave()
          headingDimension()
          updateIframeFromSavedContent()
        })
      }

      // Notify error
      else
        notify(HEADING_TRASFORMATION_FORBIDDEN, 'error', 2000)
    }
  },

  /**
   * 
   */
  downgrade: function () {

    let selectedElement = $(tinymce.activeEditor.selection.getNode())

    if (selectedElement.is('h1,h2,h3,h4,h5,h6')) {
      // Get the references of selected and sibling section
      let selectedSection = selectedElement.parent(SECTION_SELECTOR)
      let siblingSection = selectedSection.prev(SECTION_SELECTOR)

      // If there is a previous sibling section downgrade is allowed
      if (siblingSection.length) {

        // Everything in here, is an atomic undo level
        tinymce.activeEditor.undoManager.transact(function () {

          // Save the section and detach
          let bodySection = $(selectedSection[0].outerHTML)
          selectedSection.detach()

          // Update dimension and move the section out
          siblingSection.append(bodySection)

          tinymce.triggerSave()
          // Refresh tinymce content and set the heading dimension
          headingDimension()
          updateIframeFromSavedContent()
        })
      }
    }

    // Notify error
    else
      notify(HEADING_TRASFORMATION_FORBIDDEN, 'error', 2000)
  },

  /**
   * 
   */
  addAbstract: function () {

    if (!$(ABSTRACT_SELECTOR).length) {

      tinymce.activeEditor.undoManager.transact(function () {

        // This section can only be placed after non editable header
        $(NON_EDITABLE_HEADER_SELECTOR).after(`<section id="doc-abstract" role="doc-abstract"><h1>Abstract</h1></section>`)

        updateIframeFromSavedContent()
      })
    }

    //move caret and set focus to active aditor #105
    moveCaret(tinymce.activeEditor.dom.select(`${ABSTRACT_SELECTOR} > h1`)[0])
    scrollTo(ABSTRACT_SELECTOR)
  },

  /**
   * 
   */
  addAcknowledgements: function () {

    if (!$(ACKNOWLEDGEMENTS_SELECTOR).length) {

      let ack = $(`<section id="doc-acknowledgements" role="doc-acknowledgements"><h1>Acknowledgements</h1></section>`)

      tinymce.activeEditor.undoManager.transact(function () {

        // Insert this section after last non special section 
        // OR after abstract section 
        // OR after non editable header
        if ($(MAIN_SECTION_SELECTOR).length)
          $(MAIN_SECTION_SELECTOR).last().after(ack)

        else if ($(ABSTRACT_SELECTOR).length)
          $(ABSTRACT_SELECTOR).after(ack)

        else
          $(NON_EDITABLE_HEADER_SELECTOR).after(ack)

        updateIframeFromSavedContent()
      })
    }

    //move caret and set focus to active aditor #105
    moveCaret(tinymce.activeEditor.dom.select(`${ACKNOWLEDGEMENTS_SELECTOR} > h1`)[0])
    scrollTo(ACKNOWLEDGEMENTS_SELECTOR)
  },

  /**
   * This method is the main one. It's called because all times the intent is to add a new biblioentry (single reference)
   * Then it checks if is necessary to add the entire <section> or only the missing <ul>
   */
  addBiblioentry: function (id, text, listItem) {

    // Add bibliography section if not exists
    if (!$(BIBLIOGRAPHY_SELECTOR).length) {

      let bibliography = $(`<section id="doc-bibliography" role="doc-bibliography"><h1>References</h1><ul></ul></section>`)

      // This section is added after acknowledgements section
      // OR after last non special section
      // OR after abstract section
      // OR after non editable header 
      if ($(ACKNOWLEDGEMENTS_SELECTOR).length)
        $(ACKNOWLEDGEMENTS_SELECTOR).after(bibliography)

      else if ($(MAIN_SECTION_SELECTOR).length)
        $(MAIN_SECTION_SELECTOR).last().after(bibliography)

      else if ($(ABSTRACT_SELECTOR).length)
        $(ABSTRACT_SELECTOR).after(bibliography)

      else
        $(NON_EDITABLE_HEADER_SELECTOR).after(bibliography)

    }

    // Add ul in bibliography section if not exists
    if (!$(BIBLIOGRAPHY_SELECTOR).find('ul').length)
      $(BIBLIOGRAPHY_SELECTOR).append('<ul></ul>')

    // IF id and text aren't passed as parameters, these can be retrieved or init from here
    id = (id) ? id : getSuccessiveElementId(BIBLIOENTRY_SELECTOR, BIBLIOENTRY_SUFFIX)
    text = text ? text : '<br/>'

    let newItem = $(`<li role="doc-biblioentry" id="${id}"><p>${text}</p></li>`)

    // Append new li to ul at last position
    // OR insert the new li right after the current one
    if (!listItem)
      $(`${BIBLIOGRAPHY_SELECTOR} ul`).append(newItem)

    else
      listItem.after(newItem)
  },

  /**
   * 
   */
  updateBibliographySection: function () {

    // Synchronize iframe and stored content
    tinymce.triggerSave()

    // Remove all sections without p child
    $(`${BIBLIOENTRY_SELECTOR}:not(:has(p))`).each(function () {
      $(this).remove()
    })
  },

  /**
   * 
   */
  addEndnote: function (id) {

    // Add the section if it not exists
    if (!$(ENDNOTE_SELECTOR).length) {

      let endnotes = $(`<section id="doc-endnotes" role="doc-endnotes"><h1 data-rash-original-content="">Footnotes</h1></section>`)

      // Insert this section after bibliography section
      // OR after acknowledgements section
      // OR after non special section selector
      // OR after abstract section
      // OR after non editable header 
      if ($(BIBLIOGRAPHY_SELECTOR).length)
        $(BIBLIOGRAPHY_SELECTOR).after(endnotes)

      else if ($(ACKNOWLEDGEMENTS_SELECTOR).length)
        $(ACKNOWLEDGEMENTS_SELECTOR).after(endnotes)

      else if ($(MAIN_SECTION_SELECTOR).length)
        $(MAIN_SECTION_SELECTOR).last().after(endnotes)

      else if ($(ABSTRACT_SELECTOR).length)
        $(ABSTRACT_SELECTOR).after(endnotes)

      else
        $(NON_EDITABLE_HEADER_SELECTOR).after(endnotes)
    }

    // Create and append the new endnote
    let endnote = $(`<section role="doc-endnote" id="${id}"><p><br/></p></section>`)
    $(ENDNOTES_SELECTOR).append(endnote)
  },

  /**
   * 
   */
  updateSectionToolbar: function () {

    // Dropdown menu reference
    let menu = $(MENU_SELECTOR)

    if (menu.length) {
      section.restoreSectionToolbar(menu)

      // Save current selected element
      let selectedElement = $(tinymce.activeEditor.selection.getRng().startContainer)

      if (selectedElement[0].nodeType == 3)
        selectedElement = selectedElement.parent()

      // If current element is p
      if (selectedElement.is('p') || selectedElement.parent().is('p')) {

        // Check if caret is inside special section
        // In this case enable only first menuitem if caret is in abstract
        if (selectedElement.parents(SPECIAL_SECTION_SELECTOR).length) {

          if (selectedElement.parents(ABSTRACT_SELECTOR).length)
            menu.children(`:lt(1)`).removeClass('mce-disabled')

          return false
        }

        // Get deepness of the section
        let deepness = selectedElement.parents(SECTION_SELECTOR).length + 1

        // Remove disabling class on first {deepness} menu items
        menu.children(`:lt(${deepness})`).removeClass('mce-disabled')

        // Get the section list and update the dropdown with the right texts
        let list = section.getAncestorSectionsList(selectedElement)
        for (let i = 0; i <= list.length; i++) {
          menu.children(`:eq(${i})`).find('span.mce-text').text(list[i])
        }
      }

      // Enable only for upgrade/downgrade
      else if (!selectedElement.parents(SPECIAL_SECTION_SELECTOR).length && selectedElement.is('h1,h2,h3')) {

        // Get the selected section
        let selectedSection = selectedElement.parents(SECTION_SELECTOR).first()

        // Get the number of the heading (eg. H1 => 1, H2 => 2)
        let index = parseInt(selectedElement.prop('tagName').toLowerCase().replace('h', ''))

        // Get the deepness of the section (eg. 1 if is a main section, 2 if is a subsection)
        let deepness = selectedElement.parents(SECTION_SELECTOR).length

        // Get the list of texts that are bee
        let list = section.getAncestorSectionsList(selectedElement)

        // The text index in list
        let i = deepness - index

        // Update text upgrade and downgrade
        menu.children(`:eq(${0})`).find('span.mce-text').text('Upgrade')
        menu.children(`:eq(${1})`).find('span.mce-text').text('Downgrade')

        // Check if the current section has a parent
        // In this case the upgrade is permitted
        if (selectedSection.parent(SECTION_SELECTOR).length) {

          // menu item inside the dropdown
          let menuItem = menu.children(`:eq(${0})`)
          menuItem.removeClass('mce-disabled')
          menuItem.attr(DATA_UPGRADE, true)
        }

        if (selectedSection.prev().is(SECTION_SELECTOR)) {

          // menu item inside the dropdown
          let menuItem = menu.children(`:eq(${1})`)
          menuItem.removeClass('mce-disabled')
          menuItem.attr(DATA_DOWNGRADE, true)
        }
      }

      // Disable in any other cases
      else
        menu.children(':gt(10)').addClass('mce-disabled')
    }
  },

  getAncestorSectionsList: function (selectedElement) {

    let preHeaders = []
    let list = []
    let parentSections = selectedElement.parents('section')

    // Save index of all parent sections
    for (let i = parentSections.length; i > 0; i--) {
      let elem = $(parentSections[i - 1])
      let index = elem.parent().children(SECTION_SELECTOR).index(elem) + 1
      preHeaders.push(index)
    }

    // Update text of all menu item
    for (let i = 0; i <= preHeaders.length; i++) {

      let text = `${HEADING} `

      // Update text based on section structure
      if (i != preHeaders.length) {
        for (let x = 0; x <= i; x++)
          text += `${preHeaders[x] + (x == i ? 1 : 0)}.`
      }

      // In this case raje changes text of next sub heading
      else {
        for (let x = 0; x < i; x++)
          text += `${preHeaders[x]}.`

        text += '1.'
      }

      list.push(text)
    }

    return list
  },

  /**
   * Restore normal text in section toolbar and disable all
   */
  restoreSectionToolbar: function (menu) {

    let cnt = 1

    menu.children(':lt(6)').each(function () {
      let text = `${HEADING} `

      for (let i = 0; i < cnt; i++)
        text += `1.`

      // Remove data elements
      $(this).removeAttr(DATA_UPGRADE)
      $(this).removeAttr(DATA_DOWNGRADE)

      $(this).find('span.mce-text').text(text)
      $(this).addClass('mce-disabled')

      cnt++
    })

    // Enable upgrade/downgrade last three menu items
    menu.children(':gt(10)').removeClass('mce-disabled')
  },

  manageDelete: function () {

    let range = tinymce.activeEditor.selection.getRng()
    let startNode = $(range.startContainer).parent()
    let endNode = $(range.endContainer).parent()
    let commonAncestorContainer = $(range.commonAncestorContainer)

    // Deepness is relative to the common ancestor container of the range startContainer and end
    let deepness = endNode.parent('section').parentsUntil(commonAncestorContainer).length + 1
    let currentElement = endNode
    let toMoveElements = []

    tinymce.activeEditor.undoManager.transact(function () {

      // Get and detach all next_end
      for (let i = 0; i <= deepness; i++) {
        currentElement.nextAll('section,p,figure,pre,ul,ol').each(function () {
          toMoveElements.push($(this))

          $(this).detach()
        })
        currentElement = currentElement.parent()
      }

      // Execute delete
      tinymce.activeEditor.execCommand('delete')

      // Detach all next_begin
      startNode.nextAll().each(function () {
        $(this).detach()
      })

      // Append all next_end to startnode parent
      toMoveElements.forEach(function (element) {
        startNode.parent('section').append(element)
      })

      tinymce.triggerSave()

      // Refresh headings
      headingDimension()

      // Update references if needed
      updateReferences()

      updateIframeFromSavedContent()
    })
    return false
  }
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQuanMiLCJyYWplX2Nyb3NzcmVmLmpzIiwicmFqZV9maWd1cmVzLmpzIiwicmFqZV9pbmxpbmVzLmpzIiwicmFqZV9saXN0cy5qcyIsInJhamVfbWV0YWRhdGEuanMiLCJyYWplX3NhdmUuanMiLCJyYWplX3NlY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZrQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFxuICogSW5pdGlsaXplIFRpbnlNQ0UgZWRpdG9yIHdpdGggYWxsIHJlcXVpcmVkIG9wdGlvbnNcbiAqL1xuXG4vLyBJbnZpc2libGUgc3BhY2UgY29uc3RhbnRzXG5jb25zdCBaRVJPX1NQQUNFID0gJyYjODIwMzsnXG5jb25zdCBSQUpFX1NFTEVDVE9SID0gJ2JvZHkjdGlueW1jZSdcblxuLy8gU2VsZWN0b3IgY29uc3RhbnRzICh0byBtb3ZlIGluc2lkZSBhIG5ldyBjb25zdCBmaWxlKVxuY29uc3QgSEVBREVSX1NFTEVDVE9SID0gJ2hlYWRlci5wYWdlLWhlYWRlci5jb250YWluZXIuY2dlbidcbmNvbnN0IEZJUlNUX0hFQURJTkcgPSBgJHtSQUpFX1NFTEVDVE9SfT5zZWN0aW9uOmZpcnN0PmgxOmZpcnN0YFxuXG5jb25zdCBUSU5ZTUNFX1RPT0xCQVJfSEVJR1RIID0gNzZcblxubGV0IGlwY1JlbmRlcmVyLCB3ZWJGcmFtZVxuXG5pZiAoaGFzQmFja2VuZCkge1xuXG4gIGlwY1JlbmRlcmVyID0gcmVxdWlyZSgnZWxlY3Ryb24nKS5pcGNSZW5kZXJlclxuICB3ZWJGcmFtZSA9IHJlcXVpcmUoJ2VsZWN0cm9uJykud2ViRnJhbWVcblxuICAvKipcbiAgICogSW5pdGlsaXNlIFRpbnlNQ0UgXG4gICAqL1xuICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBPdmVycmlkZSB0aGUgbWFyZ2luIGJvdHRvbiBnaXZlbiBieSBSQVNIIGZvciB0aGUgZm9vdGVyXG4gICAgJCgnYm9keScpLmNzcyh7XG4gICAgICAnbWFyZ2luLWJvdHRvbSc6IDBcbiAgICB9KVxuXG4gICAgLy9oaWRlIGZvb3RlclxuICAgICQoJ2Zvb3Rlci5mb290ZXInKS5yZW1vdmUoKVxuXG4gICAgLy9hdHRhY2ggd2hvbGUgYm9keSBpbnNpZGUgYSBwbGFjZWhvbGRlciBkaXZcbiAgICAkKCdib2R5JykuaHRtbChgPGRpdiBpZD1cInJhamVfcm9vdFwiPiR7JCgnYm9keScpLmh0bWwoKX08L2Rpdj5gKVxuXG4gICAgLy8gXG4gICAgc2V0Tm9uRWRpdGFibGVIZWFkZXIoKVxuXG4gICAgdGlueW1jZS5pbml0KHtcblxuICAgICAgLy8gU2VsZWN0IHRoZSBlbGVtZW50IHRvIHdyYXBcbiAgICAgIHNlbGVjdG9yOiAnI3JhamVfcm9vdCcsXG5cbiAgICAgIC8vIFNldCB3aW5kb3cgc2l6ZVxuICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSBUSU5ZTUNFX1RPT0xCQVJfSEVJR1RILFxuXG4gICAgICAvLyBTZXQgdGhlIHN0eWxlcyBvZiB0aGUgY29udGVudCB3cmFwcGVkIGluc2lkZSB0aGUgZWxlbWVudFxuICAgICAgY29udGVudF9jc3M6IFsnY3NzL2Jvb3RzdHJhcC5taW4uY3NzJywgJ2Nzcy9yYXNoLmNzcycsICdjc3MvcmFqZS1jb3JlLmNzcyddLFxuXG4gICAgICAvLyBTZXQgcGx1Z2luc1xuICAgICAgcGx1Z2luczogXCJyYWplX2lubGluZUZpZ3VyZSBmdWxsc2NyZWVuIGxpbmsgY29kZXNhbXBsZSByYWplX2V4dGVybmFsTGluayByYWplX2lubGluZUNvZGUgcmFqZV9pbmxpbmVRdW90ZSByYWplX3NlY3Rpb24gdGFibGUgaW1hZ2Ugbm9uZWRpdGFibGUgcmFqZV9pbWFnZSByYWplX3F1b3RlYmxvY2sgcmFqZV9jb2RlYmxvY2sgcmFqZV90YWJsZSByYWplX2xpc3RpbmcgcmFqZV9pbmxpbmVfZm9ybXVsYSByYWplX2Zvcm11bGEgcmFqZV9jcm9zc3JlZiByYWplX2Zvb3Rub3RlcyByYWplX21ldGFkYXRhIHJhamVfbGlzdHMgcmFqZV9zYXZlXCIsXG5cbiAgICAgIC8vIFJlbW92ZSBtZW51YmFyXG4gICAgICBtZW51YmFyOiBmYWxzZSxcblxuICAgICAgLy8gQ3VzdG9tIHRvb2xiYXJcbiAgICAgIHRvb2xiYXI6ICd1bmRvIHJlZG8gYm9sZCBpdGFsaWMgbGluayBzdXBlcnNjcmlwdCBzdWJzY3JpcHQgcmFqZV9pbmxpbmVDb2RlIHJhamVfaW5saW5lUXVvdGUgcmFqZV9pbmxpbmVfZm9ybXVsYSByYWplX2Nyb3NzcmVmIHJhamVfZm9vdG5vdGVzIHwgcmFqZV9vbCByYWplX3VsIHJhamVfY29kZWJsb2NrIHJhamVfcXVvdGVibG9jayByYWplX3RhYmxlIHJhamVfaW1hZ2UgcmFqZV9saXN0aW5nIHJhamVfZm9ybXVsYSB8IHJhamVfc2VjdGlvbiByYWplX21ldGFkYXRhIHJhamVfc2F2ZScsXG5cbiAgICAgIC8vIFNldHVwIGZ1bGwgc2NyZWVuIG9uIGluaXRcbiAgICAgIHNldHVwOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG5cbiAgICAgICAgbGV0IHBhc3RlQm9va21hcmtcblxuICAgICAgICAvLyBTZXQgZnVsbHNjcmVlbiBcbiAgICAgICAgZWRpdG9yLm9uKCdpbml0JywgZnVuY3Rpb24gKGUpIHtcblxuICAgICAgICAgIGVkaXRvci5leGVjQ29tbWFuZCgnbWNlRnVsbFNjcmVlbicpXG5cbiAgICAgICAgICAvLyBNb3ZlIGNhcmV0IGF0IHRoZSBmaXJzdCBoMSBlbGVtZW50IG9mIG1haW4gc2VjdGlvblxuICAgICAgICAgIC8vIE9yIHJpZ2h0IGFmdGVyIGhlYWRpbmdcbiAgICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2V0Q3Vyc29yTG9jYXRpb24odGlueW1jZS5hY3RpdmVFZGl0b3IuZG9tLnNlbGVjdChGSVJTVF9IRUFESU5HKVswXSwgMClcbiAgICAgICAgfSlcblxuICAgICAgICBlZGl0b3Iub24oJ2tleURvd24nLCBmdW5jdGlvbiAoZSkge1xuXG4gICAgICAgICAgLy8gUHJldmVudCBzaGlmdCtlbnRlclxuICAgICAgICAgIGlmIChlLmtleUNvZGUgPT0gMTMgJiYgZS5zaGlmdEtleSlcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgICAgICAgaWYgKGUua2V5Q29kZSA9PSA4NiAmJiBlLm1ldGFLZXkpIHtcblxuICAgICAgICAgICAgaWYgKCQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSkuaXMoJ3ByZScpKSB7XG5cbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcblxuICAgICAgICAgICAgICBwYXN0ZUJvb2ttYXJrID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldEJvb2ttYXJrKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKi9cbiAgICAgICAgZWRpdG9yLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cbiAgICAgICAgICAvLyBDYXB0dXJlIHRoZSB0cmlwbGUgY2xpY2sgZXZlbnRcbiAgICAgICAgICBpZiAoZS5kZXRhaWwgPT0gMykge1xuXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcblxuICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKS5zdGFydENvbnRhaW5lcikucGFyZW50cygncCxmaWdjYXB0aW9uLDpoZWFkZXInKS5maXJzdCgpXG4gICAgICAgICAgICBsZXQgc3RhcnRDb250YWluZXIgPSB3cmFwcGVyWzBdXG4gICAgICAgICAgICBsZXQgZW5kQ29udGFpbmVyID0gd3JhcHBlclswXVxuICAgICAgICAgICAgbGV0IHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKVxuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgd3JhcHBlciBoYXMgbW9yZSB0ZXh0IG5vZGUgaW5zaWRlXG4gICAgICAgICAgICBpZiAod3JhcHBlci5jb250ZW50cygpLmxlbmd0aCA+IDEpIHtcblxuICAgICAgICAgICAgICAvLyBJZiB0aGUgZmlyc3QgdGV4dCBub2RlIGlzIGEgbm90IGVkaXRhYmxlIHN0cm9uZywgdGhlIHNlbGVjdGlvbiBtdXN0IHN0YXJ0IHdpdGggdGhlIHNlY29uZCBlbGVtZW50XG4gICAgICAgICAgICAgIGlmICh3cmFwcGVyLmNvbnRlbnRzKCkuZmlyc3QoKS5pcygnc3Ryb25nW2NvbnRlbnRlZGl0YWJsZT1mYWxzZV0nKSlcbiAgICAgICAgICAgICAgICBzdGFydENvbnRhaW5lciA9IHdyYXBwZXIuY29udGVudHMoKVsxXVxuXG4gICAgICAgICAgICAgIC8vIEluIHRoaXMgY2FzZSB0aGUgZW5kQ29udGFpbmVyIHdpbGwgYmUgdGhlIGxhc3QgdGV4dCBub2RlXG4gICAgICAgICAgICAgIGVuZENvbnRhaW5lciA9IHdyYXBwZXIuY29udGVudHMoKS5sYXN0KClbMF1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQoc3RhcnRDb250YWluZXIsIDApXG5cbiAgICAgICAgICAgIGlmICh3cmFwcGVyLmlzKCdmaWdjYXB0aW9uJykpXG4gICAgICAgICAgICAgIHJhbmdlLnNldEVuZChlbmRDb250YWluZXIsIGVuZENvbnRhaW5lci5sZW5ndGgpXG5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kKGVuZENvbnRhaW5lciwgMSlcblxuICAgICAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldFJuZyhyYW5nZSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSlcblxuICAgICAgICAvLyBQcmV2ZW50IHNwYW4gXG4gICAgICAgIGVkaXRvci5vbignbm9kZUNoYW5nZScsIGZ1bmN0aW9uIChlKSB7XG5cbiAgICAgICAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuXG4gICAgICAgICAgLy8gTW92ZSBjYXJldCB0byBmaXJzdCBoZWFkaW5nIGlmIGlzIGFmdGVyIG9yIGJlZm9yZSBub3QgZWRpdGFibGUgaGVhZGVyXG4gICAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC5pcygncCcpICYmIChzZWxlY3RlZEVsZW1lbnQubmV4dCgpLmlzKEhFQURFUl9TRUxFQ1RPUikgfHwgKHNlbGVjdGVkRWxlbWVudC5wcmV2KCkuaXMoSEVBREVSX1NFTEVDVE9SKSAmJiB0aW55bWNlLmFjdGl2ZUVkaXRvci5kb20uc2VsZWN0KEZJUlNUX0hFQURJTkcpLmxlbmd0aCkpKVxuICAgICAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldEN1cnNvckxvY2F0aW9uKHRpbnltY2UuYWN0aXZlRWRpdG9yLmRvbS5zZWxlY3QoRklSU1RfSEVBRElORylbMF0sIDApXG5cbiAgICAgICAgICAvLyBJZiB0aGUgY3VycmVudCBlbGVtZW50IGlzbid0IGluc2lkZSBoZWFkZXIsIG9ubHkgaW4gc2VjdGlvbiB0aGlzIGlzIHBlcm1pdHRlZFxuICAgICAgICAgIGlmIChzZWxlY3RlZEVsZW1lbnQucGFyZW50cygnc2VjdGlvbicpLmxlbmd0aCkge1xuXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKCdzcGFuI19tY2VfY2FyZXRbZGF0YS1tY2UtYm9ndXNdJykgfHwgc2VsZWN0ZWRFbGVtZW50LnBhcmVudCgpLmlzKCdzcGFuI19tY2VfY2FyZXRbZGF0YS1tY2UtYm9ndXNdJykpIHtcblxuICAgICAgICAgICAgICAvLyBSZW1vdmUgc3BhbiBub3JtYWxseSBjcmVhdGVkIHdpdGggYm9sZFxuICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LnBhcmVudCgpLmlzKCdzcGFuI19tY2VfY2FyZXRbZGF0YS1tY2UtYm9ndXNdJykpXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRFbGVtZW50ID0gc2VsZWN0ZWRFbGVtZW50LnBhcmVudCgpXG5cbiAgICAgICAgICAgICAgbGV0IGJtID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldEJvb2ttYXJrKClcbiAgICAgICAgICAgICAgc2VsZWN0ZWRFbGVtZW50LnJlcGxhY2VXaXRoKHNlbGVjdGVkRWxlbWVudC5odG1sKCkpXG4gICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5tb3ZlVG9Cb29rbWFyayhibSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB1cGRhdGVEb2N1bWVudFN0YXRlKClcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBVcGRhdGUgc2F2ZWQgY29udGVudCBvbiB1bmRvIGFuZCByZWRvIGV2ZW50c1xuICAgICAgICBlZGl0b3Iub24oJ1VuZG8nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuICAgICAgICB9KVxuXG4gICAgICAgIGVkaXRvci5vbignUmVkbycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG4gICAgICAgIH0pXG5cbiAgICAgICAgZWRpdG9yLm9uKCdQYXN0ZScsIGZ1bmN0aW9uIChlKSB7XG5cbiAgICAgICAgICBsZXQgdGFyZ2V0ID0gJChlLnRhcmdldClcblxuICAgICAgICAgIC8vIElmIHRoZSBwYXN0ZSBldmVudCBpcyBjYWxsZWQgaW5zaWRlIGEgbGlzdGluZ1xuICAgICAgICAgIGlmIChwYXN0ZUJvb2ttYXJrICYmIHRhcmdldC5wYXJlbnRzKCdmaWd1cmU6aGFzKHByZTpoYXMoY29kZSkpJykubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIGxldCBkYXRhID0gZS5jbGlwYm9hcmREYXRhLmdldERhdGEoJ1RleHQnKVxuXG4gICAgICAgICAgICAvLyBSZXN0b3JlIHRoZSBzZWxlY3Rpb24gc2F2ZWQgb24gY21kK3ZcbiAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5tb3ZlVG9Cb29rbWFyayhwYXN0ZUJvb2ttYXJrKVxuXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGNvbnRlbnRcbiAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRDb250ZW50KGUuY2xpcGJvYXJkRGF0YS5nZXREYXRhKCdUZXh0JykpXG5cbiAgICAgICAgICAgIHBhc3RlQm9va21hcmsgPSBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSxcblxuICAgICAgLy8gU2V0IGRlZmF1bHQgdGFyZ2V0XG4gICAgICBkZWZhdWx0X2xpbmtfdGFyZ2V0OiBcIl9ibGFua1wiLFxuXG4gICAgICAvLyBQcmVwZW5kIHByb3RvY29sIGlmIHRoZSBsaW5rIHN0YXJ0cyB3aXRoIHd3d1xuICAgICAgbGlua19hc3N1bWVfZXh0ZXJuYWxfdGFyZ2V0czogdHJ1ZSxcblxuICAgICAgLy8gSGlkZSB0YXJnZXQgbGlzdFxuICAgICAgdGFyZ2V0X2xpc3Q6IGZhbHNlLFxuXG4gICAgICAvLyBIaWRlIHRpdGxlXG4gICAgICBsaW5rX3RpdGxlOiBmYWxzZSxcblxuICAgICAgLy8gU2V0IGZvcm1hdHNcbiAgICAgIGZvcm1hdHM6IHtcbiAgICAgICAgdW5kZXJsaW5lOiB7fVxuICAgICAgfSxcblxuICAgICAgLy8gUmVtb3ZlIFwicG93ZXJlZCBieSB0aW55bWNlXCJcbiAgICAgIGJyYW5kaW5nOiBmYWxzZSxcblxuICAgICAgLy8gUHJldmVudCBhdXRvIGJyIG9uIGVsZW1lbnQgaW5zZXJ0XG4gICAgICBhcHBseV9zb3VyY2VfZm9ybWF0dGluZzogZmFsc2UsXG5cbiAgICAgIC8vIFByZXZlbnQgbm9uIGVkaXRhYmxlIG9iamVjdCByZXNpemVcbiAgICAgIG9iamVjdF9yZXNpemluZzogZmFsc2UsXG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgdGFibGUgcG9wb3ZlciBsYXlvdXRcbiAgICAgIHRhYmxlX3Rvb2xiYXI6IFwidGFibGVpbnNlcnRyb3diZWZvcmUgdGFibGVpbnNlcnRyb3dhZnRlciB0YWJsZWRlbGV0ZXJvdyB8IHRhYmxlaW5zZXJ0Y29sYmVmb3JlIHRhYmxlaW5zZXJ0Y29sYWZ0ZXIgdGFibGVkZWxldGVjb2xcIixcblxuICAgICAgaW1hZ2VfYWR2dGFiOiB0cnVlLFxuXG4gICAgICBwYXN0ZV9ibG9ja19kcm9wOiB0cnVlLFxuXG4gICAgICBleHRlbmRlZF92YWxpZF9lbGVtZW50czogXCJzdmdbKl0sZGVmc1sqXSxwYXR0ZXJuWypdLGRlc2NbKl0sbWV0YWRhdGFbKl0sZ1sqXSxtYXNrWypdLHBhdGhbKl0sbGluZVsqXSxtYXJrZXJbKl0scmVjdFsqXSxjaXJjbGVbKl0sZWxsaXBzZVsqXSxwb2x5Z29uWypdLHBvbHlsaW5lWypdLGxpbmVhckdyYWRpZW50WypdLHJhZGlhbEdyYWRpZW50WypdLHN0b3BbKl0saW1hZ2VbKl0sdmlld1sqXSx0ZXh0WypdLHRleHRQYXRoWypdLHRpdGxlWypdLHRzcGFuWypdLGdseXBoWypdLHN5bWJvbFsqXSxzd2l0Y2hbKl0sdXNlWypdXCIsXG5cbiAgICAgIGZvcm11bGE6IHtcbiAgICAgICAgcGF0aDogJ25vZGVfbW9kdWxlcy90aW55bWNlLWZvcm11bGEvJ1xuICAgICAgfSxcblxuICAgICAgY2xlYW51cF9vbl9zdGFydHVwOiBmYWxzZSxcbiAgICAgIHRyaW1fc3Bhbl9lbGVtZW50czogZmFsc2UsXG4gICAgICB2ZXJpZnlfaHRtbDogZmFsc2UsXG4gICAgICBjbGVhbnVwOiBmYWxzZSxcbiAgICAgIGNvbnZlcnRfdXJsczogZmFsc2VcbiAgICB9KVxuICB9KVxuXG4gIC8qKlxuICAgKiBPcGVuIGFuZCBjbG9zZSB0aGUgaGVhZGluZ3MgZHJvcGRvd25cbiAgICovXG4gICQod2luZG93KS5sb2FkKGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIE9wZW4gYW5kIGNsb3NlIG1lbnUgaGVhZGluZ3MgTsOkaXZlIHdheVxuICAgICQoYGRpdlthcmlhLWxhYmVsPSdoZWFkaW5nJ11gKS5maW5kKCdidXR0b24nKS50cmlnZ2VyKCdjbGljaycpXG4gICAgJChgZGl2W2FyaWEtbGFiZWw9J2hlYWRpbmcnXWApLmZpbmQoJ2J1dHRvbicpLnRyaWdnZXIoJ2NsaWNrJylcbiAgfSlcblxuXG4gIC8qKlxuICAgKiBVcGRhdGUgY29udGVudCBpbiB0aGUgaWZyYW1lLCB3aXRoIHRoZSBvbmUgc3RvcmVkIGJ5IHRpbnltY2VcbiAgICogQW5kIHNhdmUvcmVzdG9yZSB0aGUgc2VsZWN0aW9uXG4gICAqL1xuICBmdW5jdGlvbiB1cGRhdGVJZnJhbWVGcm9tU2F2ZWRDb250ZW50KCkge1xuXG4gICAgLy8gU2F2ZSB0aGUgYm9va21hcmsgXG4gICAgbGV0IGJvb2ttYXJrID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldEJvb2ttYXJrKDIsIHRydWUpXG5cbiAgICAvLyBVcGRhdGUgaWZyYW1lIGNvbnRlbnRcbiAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZXRDb250ZW50KCQoJyNyYWplX3Jvb3QnKS5odG1sKCkpXG5cbiAgICAvLyBSZXN0b3JlIHRoZSBib29rbWFyayBcbiAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24ubW92ZVRvQm9va21hcmsoYm9va21hcmspXG4gIH1cblxuICAvKipcbiAgICogQWNjZXB0IGEganMgb2JqZWN0IHRoYXQgZXhpc3RzIGluIGZyYW1lXG4gICAqIEBwYXJhbSB7Kn0gZWxlbWVudCBcbiAgICovXG4gIGZ1bmN0aW9uIG1vdmVDYXJldChlbGVtZW50LCB0b1N0YXJ0KSB7XG4gICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNlbGVjdChlbGVtZW50LCB0cnVlKVxuICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5jb2xsYXBzZSh0b1N0YXJ0KVxuXG4gICAgdGlueW1jZS5hY3RpdmVFZGl0b3IuZm9jdXMoKVxuICB9XG5cbiAgLyoqXG4gICAqIFxuICAgKi9cbiAgZnVuY3Rpb24gc2VsZWN0UmFuZ2Uoc3RhcnRDb250YWluZXIsIHN0YXJ0T2Zmc2V0LCBlbmRDb250YWluZXIsIGVuZE9mZnNldCkge1xuXG4gICAgbGV0IHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKVxuICAgIHJhbmdlLnNldFN0YXJ0KHN0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldClcblxuICAgIC8vIElmIHRoZXNlIHByb3BlcnRpZXMgYXJlIG5vdCBpbiB0aGUgc2lnbmF0dXJlIHVzZSB0aGUgc3RhcnRcbiAgICBpZiAoIWVuZENvbnRhaW5lciAmJiAhZW5kT2Zmc2V0KSB7XG4gICAgICBlbmRDb250YWluZXIgPSBzdGFydENvbnRhaW5lclxuICAgICAgZW5kT2Zmc2V0ID0gc3RhcnRPZmZzZXRcbiAgICB9XG5cbiAgICByYW5nZS5zZXRFbmQoZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpXG4gICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldFJuZyhyYW5nZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIHsqfSBlbGVtZW50IFxuICAgKi9cbiAgZnVuY3Rpb24gbW92ZUN1cnNvclRvRW5kKGVsZW1lbnQpIHtcblxuICAgIGxldCBoZWFkaW5nID0gZWxlbWVudFxuICAgIGxldCBvZmZzZXQgPSAwXG5cbiAgICBpZiAoaGVhZGluZy5jb250ZW50cygpLmxlbmd0aCkge1xuXG4gICAgICBoZWFkaW5nID0gaGVhZGluZy5jb250ZW50cygpLmxhc3QoKVxuXG4gICAgICAvLyBJZiB0aGUgbGFzdCBub2RlIGlzIGEgc3Ryb25nLGVtLHEgZXRjLiB3ZSBoYXZlIHRvIHRha2UgaXRzIHRleHQgXG4gICAgICBpZiAoaGVhZGluZ1swXS5ub2RlVHlwZSAhPSAzKVxuICAgICAgICBoZWFkaW5nID0gaGVhZGluZy5jb250ZW50cygpLmxhc3QoKVxuXG4gICAgICBvZmZzZXQgPSBoZWFkaW5nWzBdLndob2xlVGV4dC5sZW5ndGhcbiAgICB9XG5cbiAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5mb2N1cygpXG4gICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldEN1cnNvckxvY2F0aW9uKGhlYWRpbmdbMF0sIG9mZnNldClcbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIHsqfSBlbGVtZW50IFxuICAgKi9cbiAgZnVuY3Rpb24gbW92ZUN1cnNvclRvU3RhcnQoZWxlbWVudCkge1xuXG4gICAgbGV0IGhlYWRpbmcgPSBlbGVtZW50XG4gICAgbGV0IG9mZnNldCA9IDBcblxuICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmZvY3VzKClcbiAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2V0Q3Vyc29yTG9jYXRpb24oaGVhZGluZ1swXSwgb2Zmc2V0KVxuICB9XG5cblxuICAvKipcbiAgICogQ3JlYXRlIGN1c3RvbSBpbnRvIG5vdGlmaWNhdGlvblxuICAgKiBAcGFyYW0geyp9IHRleHQgXG4gICAqIEBwYXJhbSB7Kn0gdGltZW91dCBcbiAgICovXG4gIGZ1bmN0aW9uIG5vdGlmeSh0ZXh0LCB0eXBlLCB0aW1lb3V0KSB7XG5cbiAgICAvLyBEaXNwbGF5IG9ubHkgb25lIG5vdGlmaWNhdGlvbiwgYmxvY2tpbmcgYWxsIG90aGVyc1xuICAgIGlmICh0aW55bWNlLmFjdGl2ZUVkaXRvci5ub3RpZmljYXRpb25NYW5hZ2VyLmdldE5vdGlmaWNhdGlvbnMoKS5sZW5ndGggPT0gMCkge1xuXG4gICAgICBsZXQgbm90aWZ5ID0ge1xuICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICB0eXBlOiB0eXBlID8gdHlwZSA6ICdpbmZvJyxcbiAgICAgICAgdGltZW91dDogdGltZW91dCA/IHRpbWVvdXQgOiAxMDAwXG4gICAgICB9XG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLm5vdGlmaWNhdGlvbk1hbmFnZXIub3Blbihub3RpZnkpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFxuICAgKiBAcGFyYW0geyp9IGVsZW1lbnRTZWxlY3RvciBcbiAgICovXG4gIGZ1bmN0aW9uIHNjcm9sbFRvKGVsZW1lbnRTZWxlY3Rvcikge1xuICAgICQodGlueW1jZS5hY3RpdmVFZGl0b3IuZ2V0Qm9keSgpKS5maW5kKGVsZW1lbnRTZWxlY3RvcikuZ2V0KDApLnNjcm9sbEludG9WaWV3KCk7XG4gIH1cblxuICAvKipcbiAgICogXG4gICAqL1xuICBmdW5jdGlvbiBnZXRTdWNjZXNzaXZlRWxlbWVudElkKGVsZW1lbnRTZWxlY3RvciwgU1VGRklYKSB7XG5cbiAgICBsZXQgbGFzdElkID0gMFxuXG4gICAgJChlbGVtZW50U2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGN1cnJlbnRJZCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignaWQnKS5yZXBsYWNlKFNVRkZJWCwgJycpKVxuICAgICAgbGFzdElkID0gY3VycmVudElkID4gbGFzdElkID8gY3VycmVudElkIDogbGFzdElkXG4gICAgfSlcblxuICAgIHJldHVybiBgJHtTVUZGSVh9JHtsYXN0SWQrMX1gXG4gIH1cblxuICAvKipcbiAgICogXG4gICAqL1xuICBmdW5jdGlvbiBoZWFkaW5nRGltZW5zaW9uKCkge1xuICAgICQoJ2gxLGgyLGgzLGg0LGg1LGg2JykuZWFjaChmdW5jdGlvbiAoKSB7XG5cbiAgICAgIGlmICghJCh0aGlzKS5wYXJlbnRzKEhFQURFUl9TRUxFQ1RPUikubGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb3VudGVyID0gMDtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnRzKFwic2VjdGlvblwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoJCh0aGlzKS5jaGlsZHJlbihcImgxLGgyLGgzLGg0LGg1LGg2XCIpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvdW50ZXIrKztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkKHRoaXMpLnJlcGxhY2VXaXRoKFwiPGhcIiArIGNvdW50ZXIgKyBcIj5cIiArICQodGhpcykuaHRtbCgpICsgXCI8L2hcIiArIGNvdW50ZXIgKyBcIj5cIilcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGZ1bmN0aW9uIGNoZWNrSWZQcmludGFibGVDaGFyKGtleWNvZGUpIHtcblxuICAgIHJldHVybiAoa2V5Y29kZSA+IDQ3ICYmIGtleWNvZGUgPCA1OCkgfHwgLy8gbnVtYmVyIGtleXNcbiAgICAgIChrZXljb2RlID09IDMyIHx8IGtleWNvZGUgPT0gMTMpIHx8IC8vIHNwYWNlYmFyICYgcmV0dXJuIGtleShzKSAoaWYgeW91IHdhbnQgdG8gYWxsb3cgY2FycmlhZ2UgcmV0dXJucylcbiAgICAgIChrZXljb2RlID4gNjQgJiYga2V5Y29kZSA8IDkxKSB8fCAvLyBsZXR0ZXIga2V5c1xuICAgICAgKGtleWNvZGUgPiA5NSAmJiBrZXljb2RlIDwgMTEyKSB8fCAvLyBudW1wYWQga2V5c1xuICAgICAgKGtleWNvZGUgPiAxODUgJiYga2V5Y29kZSA8IDE5MykgfHwgLy8gOz0sLS4vYCAoaW4gb3JkZXIpXG4gICAgICAoa2V5Y29kZSA+IDIxOCAmJiBrZXljb2RlIDwgMjIzKTsgLy8gW1xcXScgKGluIG9yZGVyKVxuICB9XG5cbiAgLyoqXG4gICAqIFxuICAgKi9cbiAgZnVuY3Rpb24gbWFya1RpbnlNQ0UoKSB7XG4gICAgJCgnZGl2W2lkXj1tY2V1X10nKS5hdHRyKCdkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudCcsICcnKVxuICB9XG5cbiAgLyoqXG4gICAqIFxuICAgKi9cbiAgZnVuY3Rpb24gc2V0Tm9uRWRpdGFibGVIZWFkZXIoKSB7XG4gICAgJChIRUFERVJfU0VMRUNUT1IpLmFkZENsYXNzKCdtY2VOb25FZGl0YWJsZScpXG4gIH1cblxuICAvKipcbiAgICogXG4gICAqL1xuICBmdW5jdGlvbiBjaGVja0lmQXBwKCkge1xuICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYygnaXNBcHBTeW5jJylcbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGZ1bmN0aW9uIHNlbGVjdEltYWdlKCkge1xuICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYygnc2VsZWN0SW1hZ2VTeW5jJylcbiAgfVxuXG5cblxuICAvKipcbiAgICogU2VuZCBhIG1lc3NhZ2UgdG8gdGhlIGJhY2tlbmQsIG5vdGlmeSB0aGUgc3RydWN0dXJhbCBjaGFuZ2VcbiAgICogXG4gICAqIElmIHRoZSBkb2N1bWVudCBpcyBkcmFmdCBzdGF0ZSA9IHRydWVcbiAgICogSWYgdGhlIGRvY3VtZW50IGlzIHNhdmVkIHN0YXRlID0gZmFsc2VcbiAgICovXG4gIGZ1bmN0aW9uIHVwZGF0ZURvY3VtZW50U3RhdGUoKSB7XG5cbiAgICAvLyBHZXQgdGhlIElmcmFtZSBjb250ZW50IG5vdCBpbiB4bWwgXG4gICAgbGV0IEpxdWVyeUlmcmFtZSA9ICQoYDxkaXY+JHt0aW55bWNlLmFjdGl2ZUVkaXRvci5nZXRDb250ZW50KCl9PC9kaXY+YClcbiAgICBsZXQgSnF1ZXJ5U2F2ZWRDb250ZW50ID0gJChgI3JhamVfcm9vdGApXG5cbiAgICAvLyBUcnVlIGlmIHRoZXkncmUgZGlmZmVyZW50LCBGYWxzZSBpcyB0aGV5J3JlIGVxdWFsXG4gICAgaXBjUmVuZGVyZXIuc2VuZCgndXBkYXRlRG9jdW1lbnRTdGF0ZScsIEpxdWVyeUlmcmFtZS5odG1sKCkgIT0gSnF1ZXJ5U2F2ZWRDb250ZW50Lmh0bWwoKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGZ1bmN0aW9uIHNhdmVBc0FydGljbGUob3B0aW9ucykge1xuICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kKCdzYXZlQXNBcnRpY2xlJywgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGZ1bmN0aW9uIHNhdmVBcnRpY2xlKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gaXBjUmVuZGVyZXIuc2VuZCgnc2F2ZUFydGljbGUnLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHRoZSBzYXZlIGFzIHByb2Nlc3MgZ2V0dGluZyB0aGUgZGF0YSBhbmQgc2VuZGluZyBpdFxuICAgKiB0byB0aGUgbWFpbiBwcm9jZXNzXG4gICAqL1xuICBpcGNSZW5kZXJlci5vbignZXhlY3V0ZVNhdmVBcycsIChldmVudCwgZGF0YSkgPT4ge1xuICAgIHNhdmVNYW5hZ2VyLnNhdmVBcygpXG4gIH0pXG5cbiAgLyoqXG4gICAqIFN0YXJ0IHRoZSBzYXZlIHByb2Nlc3MgZ2V0dGluZyB0aGUgZGF0YSBhbmQgc2VuZGluZyBpdFxuICAgKiB0byB0aGUgbWFpbiBwcm9jZXNzXG4gICAqL1xuICBpcGNSZW5kZXJlci5vbignZXhlY3V0ZVNhdmUnLCAoZXZlbnQsIGRhdGEpID0+IHtcbiAgICBzYXZlTWFuYWdlci5zYXZlKClcbiAgfSlcblxuICAvKipcbiAgICogXG4gICAqL1xuICBpcGNSZW5kZXJlci5vbignbm90aWZ5JywgKGV2ZW50LCBkYXRhKSA9PiB7XG4gICAgbm90aWZ5KGRhdGEudGV4dCwgZGF0YS50eXBlLCBkYXRhLnRpbWVvdXQpXG4gIH0pXG5cbiAgLyoqXG4gICAqIFxuICAgKi9cbiAgaXBjUmVuZGVyZXIub24oJ3VwZGF0ZUNvbnRlbnQnLCAoZXZlbnQsIGRhdGEpID0+IHtcbiAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcbiAgfSlcbn0iLCJ0aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdyYWplX2Nyb3NzcmVmJywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG5cbiAgLy8gQWRkIGEgYnV0dG9uIHRoYXQgaGFuZGxlIHRoZSBpbmxpbmUgZWxlbWVudFxuICBlZGl0b3IuYWRkQnV0dG9uKCdyYWplX2Nyb3NzcmVmJywge1xuICAgIHRpdGxlOiAncmFqZV9jcm9zc3JlZicsXG4gICAgaWNvbjogJ2ljb24tYW5jaG9yJyxcbiAgICB0b29sdGlwOiAnQ3Jvc3MtcmVmZXJlbmNlJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IGAke0RJU0FCTEVfU0VMRUNUT1JfSU5MSU5FfSw6aGVhZGVyYCxcblxuICAgIC8vIEJ1dHRvbiBiZWhhdmlvdXJcbiAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICBsZXQgcmVmZXJlbmNlYWJsZUxpc3QgPSB7XG4gICAgICAgIHNlY3Rpb25zOiBjcm9zc3JlZi5nZXRBbGxSZWZlcmVuY2VhYmxlU2VjdGlvbnMoKSxcbiAgICAgICAgdGFibGVzOiBjcm9zc3JlZi5nZXRBbGxSZWZlcmVuY2VhYmxlVGFibGVzKCksXG4gICAgICAgIGZpZ3VyZXM6IGNyb3NzcmVmLmdldEFsbFJlZmVyZW5jZWFibGVGaWd1cmVzKCksXG4gICAgICAgIGxpc3RpbmdzOiBjcm9zc3JlZi5nZXRBbGxSZWZlcmVuY2VhYmxlTGlzdGluZ3MoKSxcbiAgICAgICAgZm9ybXVsYXM6IGNyb3NzcmVmLmdldEFsbFJlZmVyZW5jZWFibGVGb3JtdWxhcygpLFxuICAgICAgICByZWZlcmVuY2VzOiBjcm9zc3JlZi5nZXRBbGxSZWZlcmVuY2VhYmxlUmVmZXJlbmNlcygpXG4gICAgICB9XG5cbiAgICAgIGVkaXRvci53aW5kb3dNYW5hZ2VyLm9wZW4oe1xuICAgICAgICAgIHRpdGxlOiAnQ3Jvc3MtcmVmZXJlbmNlIGVkaXRvcicsXG4gICAgICAgICAgdXJsOiAnanMvcmFqZS1jb3JlL3BsdWdpbi9yYWplX2Nyb3NzcmVmLmh0bWwnLFxuICAgICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgICAgaGVpZ2h0OiA4MDAsXG4gICAgICAgICAgb25DbG9zZTogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFxuICAgICAgICAgICAgICogVGhpcyBiZWhhdmlvdXIgaXMgY2FsbGVkIHdoZW4gdXNlciBwcmVzcyBcIkFERCBORVcgUkVGRVJFTkNFXCIgXG4gICAgICAgICAgICAgKiBidXR0b24gZnJvbSB0aGUgbW9kYWxcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKHRpbnltY2UuYWN0aXZlRWRpdG9yLmNyZWF0ZU5ld1JlZmVyZW5jZSkge1xuXG4gICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIC8vIEdldCBzdWNjZXNzaXZlIGJpYmxpb2VudHJ5IGlkXG4gICAgICAgICAgICAgICAgbGV0IGlkID0gZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChCSUJMSU9FTlRSWV9TRUxFQ1RPUiwgQklCTElPRU5UUllfU1VGRklYKVxuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSByZWZlcmVuY2UgdGhhdCBwb2ludHMgdG8gdGhlIG5leHQgaWRcbiAgICAgICAgICAgICAgICBjcm9zc3JlZi5hZGQoaWQpXG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIG5leHQgYmlibGlvZW50cnlcbiAgICAgICAgICAgICAgICBzZWN0aW9uLmFkZEJpYmxpb2VudHJ5KGlkKVxuXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSByZWZlcmVuY2VcbiAgICAgICAgICAgICAgICBjcm9zc3JlZi51cGRhdGUoKVxuXG4gICAgICAgICAgICAgICAgLy8gTW92ZSBjYXJldCB0byBzdGFydCBvZiB0aGUgbmV3IGJpYmxpb2VudHJ5IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAvLyBJc3N1ZSAjMTA1IEZpcmVmb3ggKyBDaHJvbWl1bVxuICAgICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRDdXJzb3JMb2NhdGlvbigkKHRpbnltY2UuYWN0aXZlRWRpdG9yLmRvbS5nZXQoaWQpKS5maW5kKCdwJylbMF0sIGZhbHNlKVxuICAgICAgICAgICAgICAgIHNjcm9sbFRvKGAke0JJQkxJT0VOVFJZX1NFTEVDVE9SfSMke2lkfWApXG4gICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgLy8gU2V0IHZhcmlhYmxlIG51bGwgZm9yIHN1Y2Nlc3NpdmUgdXNhZ2VzXG4gICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmNyZWF0ZU5ld1JlZmVyZW5jZSA9IG51bGxcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGlzIGlzIGNhbGxlZCBpZiBhIG5vcm1hbCByZWZlcmVuY2UgaXMgc2VsZWN0ZWQgZnJvbSBtb2RhbFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBlbHNlIGlmICh0aW55bWNlLmFjdGl2ZUVkaXRvci5yZWZlcmVuY2UpIHtcblxuICAgICAgICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGVtcHR5IGFuY2hvciBhbmQgdXBkYXRlIGl0cyBjb250ZW50XG4gICAgICAgICAgICAgICAgY3Jvc3NyZWYuYWRkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnJlZmVyZW5jZSlcbiAgICAgICAgICAgICAgICBjcm9zc3JlZi51cGRhdGUoKVxuXG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkTm9kZSA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgc2VsZWN0IHRoZSBsYXN0IGVsZW1lbnQgKGxhc3QgYnkgb3JkZXIpIGFuZCBjb2xsYXBzZSB0aGUgc2VsZWN0aW9uIGFmdGVyIHRoZSBub2RlXG4gICAgICAgICAgICAgICAgLy8gIzEwNSBGaXJlZm94ICsgQ2hyb21pdW1cbiAgICAgICAgICAgICAgICAvL3RpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRDdXJzb3JMb2NhdGlvbigkKHRpbnltY2UuYWN0aXZlRWRpdG9yLmRvbS5zZWxlY3QoYGFbaHJlZj1cIiMke3RpbnltY2UuYWN0aXZlRWRpdG9yLnJlZmVyZW5jZX1cIl06bGFzdC1jaGlsZGApKVswXSwgZmFsc2UpXG4gICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgLy8gU2V0IHZhcmlhYmxlIG51bGwgZm9yIHN1Y2Nlc3NpdmUgdXNhZ2VzXG4gICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnJlZmVyZW5jZSA9IG51bGxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gTGlzdCBvZiBhbGwgcmVmZXJlbmNlYWJsZSBlbGVtZW50c1xuICAgICAgICByZWZlcmVuY2VhYmxlTGlzdClcbiAgICB9XG4gIH0pXG5cbiAgY3Jvc3NyZWYgPSB7XG4gICAgZ2V0QWxsUmVmZXJlbmNlYWJsZVNlY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIGxldCBzZWN0aW9ucyA9IFtdXG5cbiAgICAgICQoJ3NlY3Rpb24nKS5lYWNoKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBsZXQgbGV2ZWwgPSAnJ1xuXG4gICAgICAgIC8vIFNlY3Rpb25zIHdpdGhvdXQgcm9sZSBoYXZlIDphZnRlclxuICAgICAgICBpZiAoISQodGhpcykuYXR0cigncm9sZScpKSB7XG5cbiAgICAgICAgICAvLyBTYXZlIGl0cyBkZWVwbmVzc1xuICAgICAgICAgIGxldCBwYXJlbnRTZWN0aW9ucyA9ICQodGhpcykucGFyZW50c1VudGlsKCdkaXYjcmFqZV9yb290JylcblxuICAgICAgICAgIGlmIChwYXJlbnRTZWN0aW9ucy5sZW5ndGgpIHtcblxuICAgICAgICAgICAgLy8gSXRlcmF0ZSBpdHMgcGFyZW50cyBiYWNrd2FyZHMgKGhpZ2VyIGZpcnN0KVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IHBhcmVudFNlY3Rpb25zLmxlbmd0aDsgaS0tOyBpID4gMCkge1xuICAgICAgICAgICAgICBsZXQgc2VjdGlvbiA9ICQocGFyZW50U2VjdGlvbnNbaV0pXG4gICAgICAgICAgICAgIGxldmVsICs9IGAke3NlY3Rpb24ucGFyZW50KCkuY2hpbGRyZW4oU0VDVElPTl9TRUxFQ1RPUikuaW5kZXgoc2VjdGlvbikrMX0uYFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEN1cnJlbnQgaW5kZXhcbiAgICAgICAgICBsZXZlbCArPSBgJHskKHRoaXMpLnBhcmVudCgpLmNoaWxkcmVuKFNFQ1RJT05fU0VMRUNUT1IpLmluZGV4KCQodGhpcykpKzF9LmBcbiAgICAgICAgfVxuXG4gICAgICAgIHNlY3Rpb25zLnB1c2goe1xuICAgICAgICAgIHJlZmVyZW5jZTogJCh0aGlzKS5hdHRyKCdpZCcpLFxuICAgICAgICAgIHRleHQ6ICQodGhpcykuZmluZCgnOmhlYWRlcicpLmZpcnN0KCkudGV4dCgpLFxuICAgICAgICAgIGxldmVsOiBsZXZlbFxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHNlY3Rpb25zXG4gICAgfSxcblxuICAgIGdldEFsbFJlZmVyZW5jZWFibGVUYWJsZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCB0YWJsZXMgPSBbXVxuXG4gICAgICAkKCdmaWd1cmU6aGFzKHRhYmxlKScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB0YWJsZXMucHVzaCh7XG4gICAgICAgICAgcmVmZXJlbmNlOiAkKHRoaXMpLmF0dHIoJ2lkJyksXG4gICAgICAgICAgdGV4dDogJCh0aGlzKS5maW5kKCdmaWdjYXB0aW9uJykudGV4dCgpXG4gICAgICAgIH0pXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gdGFibGVzXG4gICAgfSxcblxuICAgIGdldEFsbFJlZmVyZW5jZWFibGVMaXN0aW5nczogZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGxpc3RpbmdzID0gW11cblxuICAgICAgJCgnZmlndXJlOmhhcyhwcmU6aGFzKGNvZGUpKScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBsaXN0aW5ncy5wdXNoKHtcbiAgICAgICAgICByZWZlcmVuY2U6ICQodGhpcykuYXR0cignaWQnKSxcbiAgICAgICAgICB0ZXh0OiAkKHRoaXMpLmZpbmQoJ2ZpZ2NhcHRpb24nKS50ZXh0KClcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBsaXN0aW5nc1xuICAgIH0sXG5cbiAgICBnZXRBbGxSZWZlcmVuY2VhYmxlRmlndXJlczogZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGZpZ3VyZXMgPSBbXVxuXG4gICAgICAkKCdmaWd1cmU6aGFzKHA6aGFzKGltZykpLGZpZ3VyZTpoYXMocDpoYXMoc3ZnKSknKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZmlndXJlcy5wdXNoKHtcbiAgICAgICAgICByZWZlcmVuY2U6ICQodGhpcykuYXR0cignaWQnKSxcbiAgICAgICAgICB0ZXh0OiAkKHRoaXMpLmZpbmQoJ2ZpZ2NhcHRpb24nKS50ZXh0KClcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBmaWd1cmVzXG4gICAgfSxcblxuICAgIGdldEFsbFJlZmVyZW5jZWFibGVGb3JtdWxhczogZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGZvcm11bGFzID0gW11cblxuICAgICAgJChmb3JtdWxhYm94X3NlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBmb3JtdWxhcy5wdXNoKHtcbiAgICAgICAgICByZWZlcmVuY2U6ICQodGhpcykucGFyZW50cyhGSUdVUkVfU0VMRUNUT1IpLmF0dHIoJ2lkJyksXG4gICAgICAgICAgdGV4dDogYEZvcm11bGEgJHskKHRoaXMpLnBhcmVudHMoRklHVVJFX1NFTEVDVE9SKS5maW5kKCdzcGFuLmNnZW4nKS50ZXh0KCl9YFxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIGZvcm11bGFzXG4gICAgfSxcblxuICAgIGdldEFsbFJlZmVyZW5jZWFibGVSZWZlcmVuY2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcmVmZXJlbmNlcyA9IFtdXG5cbiAgICAgICQoJ3NlY3Rpb25bcm9sZT1kb2MtYmlibGlvZ3JhcGh5XSBsaScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICByZWZlcmVuY2VzLnB1c2goe1xuICAgICAgICAgIHJlZmVyZW5jZTogJCh0aGlzKS5hdHRyKCdpZCcpLFxuICAgICAgICAgIHRleHQ6ICQodGhpcykudGV4dCgpLFxuICAgICAgICAgIGxldmVsOiAkKHRoaXMpLmluZGV4KCkgKyAxXG4gICAgICAgIH0pXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gcmVmZXJlbmNlc1xuICAgIH0sXG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChyZWZlcmVuY2UsIG5leHQpIHtcblxuICAgICAgLy8gQ3JlYXRlIHRoZSBlbXB0eSByZWZlcmVuY2Ugd2l0aCBhIHdoaXRlc3BhY2UgYXQgdGhlIGVuZFxuICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldENvbnRlbnQoYDxhIGNvbnRlbnRlZGl0YWJsZT1cImZhbHNlXCIgaHJlZj1cIiMke3JlZmVyZW5jZX1cIj4mbmJzcDs8L2E+Jm5ic3A7YClcbiAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gVXBkYXRlIHRoZSByZWZlcmVuY2UgKGluIHNhdmVkIGNvbnRlbnQpXG4gICAgICByZWZlcmVuY2VzKClcblxuICAgICAgLy8gUHJldmVudCBhZGRpbmcgb2YgbmVzdGVkIGEgYXMgZm9vdG5vdGVzXG4gICAgICAkKCdhPnN1cD5hJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCkuaHRtbCgkKHRoaXMpLnRleHQoKSlcbiAgICAgIH0pXG5cbiAgICAgIC8vIFVwZGF0ZSBlZGl0b3Igd2l0aCB0aGUgcmlnaHQgcmVmZXJlbmNlc1xuICAgICAgdXBkYXRlSWZyYW1lRnJvbVNhdmVkQ29udGVudCgpXG4gICAgfVxuICB9XG59KVxuXG50aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdyYWplX2Zvb3Rub3RlcycsIGZ1bmN0aW9uIChlZGl0b3IsIHVybCkge1xuXG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfZm9vdG5vdGVzJywge1xuICAgIHRpdGxlOiAncmFqZV9mb290bm90ZXMnLFxuICAgIGljb246ICdpY29uLWZvb3Rub3RlcycsXG4gICAgdG9vbHRpcDogJ0Zvb3Rub3RlJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IGAke0RJU0FCTEVfU0VMRUNUT1JfSU5MSU5FfSw6aGVhZGVyYCxcblxuICAgIC8vIEJ1dHRvbiBiZWhhdmlvdXJcbiAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBHZXQgc3VjY2Vzc2l2ZSBiaWJsaW9lbnRyeSBpZFxuICAgICAgICBsZXQgcmVmZXJlbmNlID0gZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChFTkROT1RFX1NFTEVDVE9SLCBFTkROT1RFX1NVRkZJWClcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHJlZmVyZW5jZSB0aGF0IHBvaW50cyB0byB0aGUgbmV4dCBpZFxuICAgICAgICBjcm9zc3JlZi5hZGQocmVmZXJlbmNlKVxuXG4gICAgICAgIC8vIEFkZCB0aGUgbmV4dCBiaWJsaW9lbnRyeVxuICAgICAgICBzZWN0aW9uLmFkZEVuZG5vdGUocmVmZXJlbmNlKVxuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgcmVmZXJlbmNlXG4gICAgICAgIGNyb3NzcmVmLnVwZGF0ZSgpXG5cbiAgICAgICAgLy8gTW92ZSBjYXJldCBhdCB0aGUgZW5kIG9mIHAgaW4gbGFzdCBpbnNlcnRlZCBlbmRub3RlXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRDdXJzb3JMb2NhdGlvbih0aW55bWNlLmFjdGl2ZUVkaXRvci5kb20uc2VsZWN0KGAke0VORE5PVEVfU0VMRUNUT1J9IyR7cmVmZXJlbmNlfT5wYClbMF0sIDEpXG4gICAgICB9KVxuICAgIH1cbiAgfSlcbn0pXG5cbmZ1bmN0aW9uIHJlZmVyZW5jZXMoKSB7XG4gIC8qIFJlZmVyZW5jZXMgKi9cbiAgJChcImFbaHJlZl1cIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQudHJpbSgkKHRoaXMpLnRleHQoKSkgPT0gJycpIHtcbiAgICAgIHZhciBjdXJfaWQgPSAkKHRoaXMpLmF0dHIoXCJocmVmXCIpO1xuICAgICAgb3JpZ2luYWxfY29udGVudCA9ICQodGhpcykuaHRtbCgpXG4gICAgICBvcmlnaW5hbF9yZWZlcmVuY2UgPSBjdXJfaWRcbiAgICAgIHJlZmVyZW5jZWRfZWxlbWVudCA9ICQoY3VyX2lkKTtcblxuICAgICAgaWYgKHJlZmVyZW5jZWRfZWxlbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlZmVyZW5jZWRfZWxlbWVudF9maWd1cmUgPSByZWZlcmVuY2VkX2VsZW1lbnQuZmluZChcbiAgICAgICAgICBmaWd1cmVib3hfc2VsZWN0b3JfaW1nICsgXCIsXCIgKyBmaWd1cmVib3hfc2VsZWN0b3Jfc3ZnKTtcbiAgICAgICAgcmVmZXJlbmNlZF9lbGVtZW50X3RhYmxlID0gcmVmZXJlbmNlZF9lbGVtZW50LmZpbmQodGFibGVib3hfc2VsZWN0b3JfdGFibGUpO1xuICAgICAgICByZWZlcmVuY2VkX2VsZW1lbnRfZm9ybXVsYSA9IHJlZmVyZW5jZWRfZWxlbWVudC5maW5kKFxuICAgICAgICAgIGZvcm11bGFib3hfc2VsZWN0b3JfaW1nICsgXCIsXCIgKyBmb3JtdWxhYm94X3NlbGVjdG9yX3NwYW4gKyBcIixcIiArIGZvcm11bGFib3hfc2VsZWN0b3JfbWF0aCArIFwiLFwiICsgZm9ybXVsYWJveF9zZWxlY3Rvcl9zdmcpO1xuICAgICAgICByZWZlcmVuY2VkX2VsZW1lbnRfbGlzdGluZyA9IHJlZmVyZW5jZWRfZWxlbWVudC5maW5kKGxpc3Rpbmdib3hfc2VsZWN0b3JfcHJlKTtcbiAgICAgICAgLyogU3BlY2lhbCBzZWN0aW9ucyAqL1xuICAgICAgICBpZiAoXG4gICAgICAgICAgJChcInNlY3Rpb25bcm9sZT1kb2MtYWJzdHJhY3RdXCIgKyBjdXJfaWQpLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgICAkKFwic2VjdGlvbltyb2xlPWRvYy1iaWJsaW9ncmFwaHldXCIgKyBjdXJfaWQpLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgICAkKFwic2VjdGlvbltyb2xlPWRvYy1lbmRub3Rlc11cIiArIGN1cl9pZCArIFwiLCBzZWN0aW9uW3JvbGU9ZG9jLWZvb3Rub3Rlc11cIiArIGN1cl9pZCkubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICQoXCJzZWN0aW9uW3JvbGU9ZG9jLWFja25vd2xlZGdlbWVudHNdXCIgKyBjdXJfaWQpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAkKHRoaXMpLmh0bWwoXCI8c3BhbiBjbGFzcz1cXFwiY2dlblxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJmYWxzZVxcXCIgIGRhdGEtcmFzaC1vcmlnaW5hbC1jb250ZW50PVxcXCJcIiArIG9yaWdpbmFsX2NvbnRlbnQgK1xuICAgICAgICAgICAgXCJcXFwiPlNlY3Rpb24gPHE+XCIgKyAkKGN1cl9pZCArIFwiID4gaDFcIikudGV4dCgpICsgXCI8L3E+PC9zcGFuPlwiKTtcbiAgICAgICAgICAvKiBCaWJsaW9ncmFwaGljIHJlZmVyZW5jZXMgKi9cbiAgICAgICAgfSBlbHNlIGlmICgkKGN1cl9pZCkucGFyZW50cyhcInNlY3Rpb25bcm9sZT1kb2MtYmlibGlvZ3JhcGh5XVwiKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIGN1cl9jb3VudCA9ICQoY3VyX2lkKS5wcmV2QWxsKFwibGlcIikubGVuZ3RoICsgMTtcbiAgICAgICAgICAkKHRoaXMpLmh0bWwoXCI8c3BhbiBjbGFzcz1cXFwiY2dlblxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJmYWxzZVxcXCIgZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQ9XFxcIlwiICsgb3JpZ2luYWxfY29udGVudCArXG4gICAgICAgICAgICBcIlxcXCIgdGl0bGU9XFxcIkJpYmxpb2dyYXBoaWMgcmVmZXJlbmNlIFwiICsgY3VyX2NvdW50ICsgXCI6IFwiICtcbiAgICAgICAgICAgICQoY3VyX2lkKS50ZXh0KCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpICsgXCJcXFwiPltcIiArIGN1cl9jb3VudCArIFwiXTwvc3Bhbj5cIik7XG4gICAgICAgICAgLyogRm9vdG5vdGUgcmVmZXJlbmNlcyAoZG9jLWZvb3Rub3RlcyBhbmQgZG9jLWZvb3Rub3RlIGluY2x1ZGVkIGZvciBlYXNpbmcgYmFjayBjb21wYXRpYmlsaXR5KSAqL1xuICAgICAgICB9IGVsc2UgaWYgKCQoY3VyX2lkKS5wYXJlbnRzKFwic2VjdGlvbltyb2xlPWRvYy1lbmRub3Rlc10sIHNlY3Rpb25bcm9sZT1kb2MtZm9vdG5vdGVzXVwiKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIGN1cl9jb250ZW50cyA9ICQodGhpcykucGFyZW50KCkuY29udGVudHMoKTtcbiAgICAgICAgICB2YXIgY3VyX2luZGV4ID0gY3VyX2NvbnRlbnRzLmluZGV4KCQodGhpcykpO1xuICAgICAgICAgIHZhciBwcmV2X3RtcCA9IG51bGw7XG4gICAgICAgICAgd2hpbGUgKGN1cl9pbmRleCA+IDAgJiYgIXByZXZfdG1wKSB7XG4gICAgICAgICAgICBjdXJfcHJldiA9IGN1cl9jb250ZW50c1tjdXJfaW5kZXggLSAxXTtcbiAgICAgICAgICAgIGlmIChjdXJfcHJldi5ub2RlVHlwZSAhPSAzIHx8ICQoY3VyX3ByZXYpLnRleHQoKS5yZXBsYWNlKC8gL2csICcnKSAhPSAnJykge1xuICAgICAgICAgICAgICBwcmV2X3RtcCA9IGN1cl9wcmV2O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY3VyX2luZGV4LS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBwcmV2X2VsID0gJChwcmV2X3RtcCk7XG4gICAgICAgICAgdmFyIGN1cnJlbnRfaWQgPSAkKHRoaXMpLmF0dHIoXCJocmVmXCIpO1xuICAgICAgICAgIHZhciBmb290bm90ZV9lbGVtZW50ID0gJChjdXJyZW50X2lkKTtcbiAgICAgICAgICBpZiAoZm9vdG5vdGVfZWxlbWVudC5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICBmb290bm90ZV9lbGVtZW50LnBhcmVudChcInNlY3Rpb25bcm9sZT1kb2MtZW5kbm90ZXNdLCBzZWN0aW9uW3JvbGU9ZG9jLWZvb3Rub3Rlc11cIikubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGNvdW50ID0gJChjdXJyZW50X2lkKS5wcmV2QWxsKFwic2VjdGlvblwiKS5sZW5ndGggKyAxO1xuICAgICAgICAgICAgaWYgKHByZXZfZWwuZmluZChcInN1cFwiKS5oYXNDbGFzcyhcImZuXCIpKSB7XG4gICAgICAgICAgICAgICQodGhpcykuYmVmb3JlKFwiPHN1cCBjbGFzcz1cXFwiY2dlblxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJmYWxzZVxcXCIgZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQ9XFxcIlxcXCI+LDwvc3VwPlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQodGhpcykuaHRtbChcIjxzdXAgY2xhc3M9XFxcImZuIGNnZW5cXFwiIGNvbnRlbnRlZGl0YWJsZT1cXFwiZmFsc2VcXFwiIGRhdGEtcmFzaC1vcmlnaW5hbC1jb250ZW50PVxcXCJcIiArIG9yaWdpbmFsX2NvbnRlbnQgKyBcIlxcXCI+XCIgK1xuICAgICAgICAgICAgICBcIjxhIG5hbWU9XFxcImZuX3BvaW50ZXJfXCIgKyBjdXJyZW50X2lkLnJlcGxhY2UoXCIjXCIsIFwiXCIpICtcbiAgICAgICAgICAgICAgXCJcXFwiIHRpdGxlPVxcXCJGb290bm90ZSBcIiArIGNvdW50ICsgXCI6IFwiICtcbiAgICAgICAgICAgICAgJChjdXJyZW50X2lkKS50ZXh0KCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpICsgXCJcXFwiPlwiICsgY291bnQgKyBcIjwvYT48L3N1cD5cIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQodGhpcykuaHRtbChcIjxzcGFuIGNsYXNzPVxcXCJlcnJvciBjZ2VuXFxcIiBjb250ZW50ZWRpdGFibGU9XFxcImZhbHNlXFxcIiBkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudD1cXFwiXCIgKyBvcmlnaW5hbF9jb250ZW50ICtcbiAgICAgICAgICAgICAgXCJcXFwiPkVSUjogZm9vdG5vdGUgJ1wiICsgY3VycmVudF9pZC5yZXBsYWNlKFwiI1wiLCBcIlwiKSArIFwiJyBkb2VzIG5vdCBleGlzdDwvc3Bhbj5cIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8qIENvbW1vbiBzZWN0aW9ucyAqL1xuICAgICAgICB9IGVsc2UgaWYgKCQoXCJzZWN0aW9uXCIgKyBjdXJfaWQpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgY3VyX2NvdW50ID0gJChjdXJfaWQpLmZpbmRIaWVyYXJjaGljYWxOdW1iZXIoXG4gICAgICAgICAgICBcInNlY3Rpb246bm90KFtyb2xlPWRvYy1hYnN0cmFjdF0pOm5vdChbcm9sZT1kb2MtYmlibGlvZ3JhcGh5XSk6XCIgK1xuICAgICAgICAgICAgXCJub3QoW3JvbGU9ZG9jLWVuZG5vdGVzXSk6bm90KFtyb2xlPWRvYy1mb290bm90ZXNdKTpub3QoW3JvbGU9ZG9jLWFja25vd2xlZGdlbWVudHNdKVwiKTtcbiAgICAgICAgICBpZiAoY3VyX2NvdW50ICE9IG51bGwgJiYgY3VyX2NvdW50ICE9IFwiXCIpIHtcbiAgICAgICAgICAgICQodGhpcykuaHRtbChcIjxzcGFuIGNsYXNzPVxcXCJjZ2VuXFxcIiBjb250ZW50ZWRpdGFibGU9XFxcImZhbHNlXFxcIiBkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudD1cXFwiXCIgKyBvcmlnaW5hbF9jb250ZW50ICtcbiAgICAgICAgICAgICAgXCJcXFwiPlNlY3Rpb24gXCIgKyBjdXJfY291bnQgKyBcIjwvc3Bhbj5cIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8qIFJlZmVyZW5jZSB0byBmaWd1cmUgYm94ZXMgKi9cbiAgICAgICAgfSBlbHNlIGlmIChyZWZlcmVuY2VkX2VsZW1lbnRfZmlndXJlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgY3VyX2NvdW50ID0gcmVmZXJlbmNlZF9lbGVtZW50X2ZpZ3VyZS5maW5kTnVtYmVyKGZpZ3VyZWJveF9zZWxlY3Rvcik7XG4gICAgICAgICAgaWYgKGN1cl9jb3VudCAhPSAwKSB7XG4gICAgICAgICAgICAkKHRoaXMpLmh0bWwoXCI8c3BhbiBjbGFzcz1cXFwiY2dlblxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJmYWxzZVxcXCIgZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQ9XFxcIlwiICsgb3JpZ2luYWxfY29udGVudCArXG4gICAgICAgICAgICAgIFwiXFxcIj5GaWd1cmUgXCIgKyBjdXJfY291bnQgKyBcIjwvc3Bhbj5cIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8qIFJlZmVyZW5jZSB0byB0YWJsZSBib3hlcyAqL1xuICAgICAgICB9IGVsc2UgaWYgKHJlZmVyZW5jZWRfZWxlbWVudF90YWJsZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIGN1cl9jb3VudCA9IHJlZmVyZW5jZWRfZWxlbWVudF90YWJsZS5maW5kTnVtYmVyKHRhYmxlYm94X3NlbGVjdG9yKTtcbiAgICAgICAgICBpZiAoY3VyX2NvdW50ICE9IDApIHtcbiAgICAgICAgICAgICQodGhpcykuaHRtbChcIjxzcGFuIGNsYXNzPVxcXCJjZ2VuXFxcIiBjb250ZW50ZWRpdGFibGU9XFxcImZhbHNlXFxcIiBkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudD1cXFwiXCIgKyBvcmlnaW5hbF9jb250ZW50ICtcbiAgICAgICAgICAgICAgXCJcXFwiPlRhYmxlIFwiICsgY3VyX2NvdW50ICsgXCI8L3NwYW4+XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvKiBSZWZlcmVuY2UgdG8gZm9ybXVsYSBib3hlcyAqL1xuICAgICAgICB9IGVsc2UgaWYgKHJlZmVyZW5jZWRfZWxlbWVudF9mb3JtdWxhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgY3VyX2NvdW50ID0gcmVmZXJlbmNlZF9lbGVtZW50X2Zvcm11bGEuZmluZE51bWJlcihmb3JtdWxhYm94X3NlbGVjdG9yKTtcbiAgICAgICAgICBpZiAoY3VyX2NvdW50ICE9IDApIHtcbiAgICAgICAgICAgICQodGhpcykuaHRtbChcIjxzcGFuIGNsYXNzPVxcXCJjZ2VuXFxcIiBjb250ZW50ZWRpdGFibGU9XFxcImZhbHNlXFxcIiBkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudD1cXFwiXCIgKyBvcmlnaW5hbF9jb250ZW50ICtcbiAgICAgICAgICAgICAgXCJcXFwiPkZvcm11bGEgXCIgKyBjdXJfY291bnQgKyBcIjwvc3Bhbj5cIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8qIFJlZmVyZW5jZSB0byBsaXN0aW5nIGJveGVzICovXG4gICAgICAgIH0gZWxzZSBpZiAocmVmZXJlbmNlZF9lbGVtZW50X2xpc3RpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHZhciBjdXJfY291bnQgPSByZWZlcmVuY2VkX2VsZW1lbnRfbGlzdGluZy5maW5kTnVtYmVyKGxpc3Rpbmdib3hfc2VsZWN0b3IpO1xuICAgICAgICAgIGlmIChjdXJfY291bnQgIT0gMCkge1xuICAgICAgICAgICAgJCh0aGlzKS5odG1sKFwiPHNwYW4gY2xhc3M9XFxcImNnZW5cXFwiIGNvbnRlbnRlZGl0YWJsZT1cXFwiZmFsc2VcXFwiIGRhdGEtcmFzaC1vcmlnaW5hbC1jb250ZW50PVxcXCJcIiArIG9yaWdpbmFsX2NvbnRlbnQgK1xuICAgICAgICAgICAgICBcIlxcXCI+TGlzdGluZyBcIiArIGN1cl9jb3VudCArIFwiPC9zcGFuPlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJCh0aGlzKS5odG1sKFwiPHNwYW4gY2xhc3M9XFxcImVycm9yIGNnZW5cXFwiIGNvbnRlbnRlZGl0YWJsZT1cXFwiZmFsc2VcXFwiIGRhdGEtcmFzaC1vcmlnaW5hbC1jb250ZW50PVxcXCJcIiArIG9yaWdpbmFsX2NvbnRlbnQgK1xuICAgICAgICAgICAgXCJcXFwiPkVSUjogcmVmZXJlbmNlZCBlbGVtZW50ICdcIiArIGN1cl9pZC5yZXBsYWNlKFwiI1wiLCBcIlwiKSArXG4gICAgICAgICAgICBcIicgaGFzIG5vdCB0aGUgY29ycmVjdCB0eXBlIChpdCBzaG91bGQgYmUgZWl0aGVyIGEgZmlndXJlLCBhIHRhYmxlLCBhIGZvcm11bGEsIGEgbGlzdGluZywgb3IgYSBzZWN0aW9uKTwvc3Bhbj5cIik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQodGhpcykucmVwbGFjZVdpdGgoXCI8c3BhbiBjbGFzcz1cXFwiZXJyb3IgY2dlblxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJmYWxzZVxcXCIgZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQ9XFxcIlwiICsgb3JpZ2luYWxfY29udGVudCArXG4gICAgICAgICAgXCJcXFwiPkVSUjogcmVmZXJlbmNlZCBlbGVtZW50ICdcIiArIGN1cl9pZC5yZXBsYWNlKFwiI1wiLCBcIlwiKSArIFwiJyBkb2VzIG5vdCBleGlzdDwvc3Bhbj5cIik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgLyogL0VORCBSZWZlcmVuY2VzICovXG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJlZmVyZW5jZXMoKSB7XG5cbiAgaWYgKCQoJ3NwYW4uY2dlbltkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudF0nKS5sZW5ndGgpIHtcblxuICAgIC8vIFJlc3RvcmUgYWxsIHNhdmVkIGNvbnRlbnRcbiAgICAkKCdzcGFuLmNnZW5bZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnRdJykuZWFjaChmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIFNhdmUgb3JpZ2luYWwgY29udGVudCBhbmQgcmVmZXJlbmNlXG4gICAgICBsZXQgb3JpZ2luYWxfY29udGVudCA9ICQodGhpcykuYXR0cignZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQnKVxuICAgICAgbGV0IG9yaWdpbmFsX3JlZmVyZW5jZSA9ICQodGhpcykucGFyZW50KCdhJykuYXR0cignaHJlZicpXG5cbiAgICAgICQodGhpcykucGFyZW50KCdhJykucmVwbGFjZVdpdGgoYDxhIGNvbnRlbnRlZGl0YWJsZT1cImZhbHNlXCIgaHJlZj1cIiR7b3JpZ2luYWxfcmVmZXJlbmNlfVwiPiR7b3JpZ2luYWxfY29udGVudH08L2E+YClcbiAgICB9KVxuXG4gICAgcmVmZXJlbmNlcygpXG4gIH1cbn0iLCIvKipcbiAqIFRoaXMgc2NyaXB0IGNvbnRhaW5zIGFsbCBmaWd1cmUgYm94IGF2YWlsYWJsZSB3aXRoIFJBU0guXG4gKiBcbiAqIHBsdWdpbnM6XG4gKiAgcmFqZV90YWJsZVxuICogIHJhamVfZmlndXJlXG4gKiAgcmFqZV9mb3JtdWxhXG4gKiAgcmFqZV9saXN0aW5nXG4gKi9cbmNvbnN0IERJU0FCTEVfU0VMRUNUT1JfRklHVVJFUyA9ICdmaWd1cmUgKiwgaDEsIGgyLCBoMywgaDQsIGg1LCBoNidcblxuY29uc3QgRklHVVJFX1NFTEVDVE9SID0gJ2ZpZ3VyZVtpZF0nXG5cbmNvbnN0IEZJR1VSRV9UQUJMRV9TRUxFQ1RPUiA9IGAke0ZJR1VSRV9TRUxFQ1RPUn06aGFzKHRhYmxlKWBcbmNvbnN0IFRBQkxFX1NVRkZJWCA9ICd0YWJsZV8nXG5cbmNvbnN0IEZJR1VSRV9JTUFHRV9TRUxFQ1RPUiA9IGAke0ZJR1VSRV9TRUxFQ1RPUn06aGFzKGltZzpub3QoW3JvbGU9bWF0aF0pKWBcbmNvbnN0IElNQUdFX1NVRkZJWCA9ICdpbWdfJ1xuXG5jb25zdCBGSUdVUkVfRk9STVVMQV9TRUxFQ1RPUiA9IGAke0ZJR1VSRV9TRUxFQ1RPUn06aGFzKHN2Z1tyb2xlPW1hdGhdKWBcbmNvbnN0IElOTElORV9GT1JNVUxBX1NFTEVDVE9SID0gYHNwYW46aGFzKHN2Z1tyb2xlPW1hdGhdKWBcbmNvbnN0IEZPUk1VTEFfU1VGRklYID0gJ2Zvcm11bGFfJ1xuXG5jb25zdCBGSUdVUkVfTElTVElOR19TRUxFQ1RPUiA9IGAke0ZJR1VSRV9TRUxFQ1RPUn06aGFzKHByZTpoYXMoY29kZSkpYFxuY29uc3QgTElTVElOR19TVUZGSVggPSAnbGlzdGluZ18nXG5cbmxldCByZW1vdmVfbGlzdGluZyA9IDBcblxuLyoqXG4gKiBSYWplX3RhYmxlXG4gKi9cbnRpbnltY2UuUGx1Z2luTWFuYWdlci5hZGQoJ3JhamVfdGFibGUnLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcblxuICAvLyBBZGQgYSBidXR0b24gdGhhdCBoYW5kbGUgdGhlIGlubGluZSBlbGVtZW50XG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfdGFibGUnLCB7XG4gICAgdGl0bGU6ICdyYWplX3RhYmxlJyxcbiAgICBpY29uOiAnaWNvbi10YWJsZScsXG4gICAgdG9vbHRpcDogJ1RhYmxlJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IERJU0FCTEVfU0VMRUNUT1JfRklHVVJFUyxcblxuICAgIC8vIEJ1dHRvbiBiZWhhdmlvdXJcbiAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIE9uIGNsaWNrIGEgZGlhbG9nIGlzIG9wZW5lZFxuICAgICAgZWRpdG9yLndpbmRvd01hbmFnZXIub3Blbih7XG4gICAgICAgIHRpdGxlOiAnU2VsZWN0IFRhYmxlIHNpemUnLFxuICAgICAgICBib2R5OiBbe1xuICAgICAgICAgIHR5cGU6ICd0ZXh0Ym94JyxcbiAgICAgICAgICBuYW1lOiAnd2lkdGgnLFxuICAgICAgICAgIGxhYmVsOiAnQ29sdW1ucydcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0Ym94JyxcbiAgICAgICAgICBuYW1lOiAnaGVpZ3RoJyxcbiAgICAgICAgICBsYWJlbDogJ1Jvd3MnXG4gICAgICAgIH1dLFxuICAgICAgICBvblN1Ym1pdDogZnVuY3Rpb24gKGUpIHtcblxuICAgICAgICAgIC8vIEdldCB3aWR0aCBhbmQgaGVpZ3RoXG4gICAgICAgICAgdGFibGUuYWRkKGUuZGF0YS53aWR0aCwgZS5kYXRhLmhlaWd0aClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgLy8gQmVjYXVzZSBzb21lIGJlaGF2aW91cnMgYXJlbid0IGFjY2VwdGVkLCBSQUpFIG11c3QgY2hlY2sgc2VsZWN0aW9uIGFuZCBhY2NlcHQgYmFja3NwYWNlLCBjYW5jIGFuZCBlbnRlciBwcmVzc1xuICBlZGl0b3Iub24oJ2tleURvd24nLCBmdW5jdGlvbiAoZSkge1xuXG4gICAgLy8ga2V5Q29kZSA4IGlzIGJhY2tzcGFjZSwgNDYgaXMgY2FuY1xuICAgIGlmIChlLmtleUNvZGUgPT0gOClcbiAgICAgIHJldHVybiBoYW5kbGVGaWd1cmVEZWxldGUodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uKVxuXG4gICAgaWYgKGUua2V5Q29kZSA9PSA0NilcbiAgICAgIHJldHVybiBoYW5kbGVGaWd1cmVDYW5jKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcblxuICAgIC8vIEhhbmRsZSBlbnRlciBrZXkgaW4gZmlnY2FwdGlvblxuICAgIGlmIChlLmtleUNvZGUgPT0gMTMpXG4gICAgICByZXR1cm4gaGFuZGxlRmlndXJlRW50ZXIodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uKVxuXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICB9KVxuXG4gIC8vIEhhbmRsZSBzdHJhbmdlIHN0cnVjdHVyYWwgbW9kaWZpY2F0aW9uIGVtcHR5IGZpZ3VyZXMgb3Igd2l0aCBjYXB0aW9uIGFzIGZpcnN0IGNoaWxkXG4gIGVkaXRvci5vbignbm9kZUNoYW5nZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgaGFuZGxlRmlndXJlQ2hhbmdlKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcbiAgfSlcblxuICB0YWJsZSA9IHtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0aGUgbmV3IHRhYmxlICh3aXRoIGdpdmVuIHNpemUpIGF0IHRoZSBjYXJldCBwb3NpdGlvblxuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24gKHdpZHRoLCBoZWlndGgpIHtcblxuICAgICAgLy8gR2V0IHRoZSByZWZlcmVuY2Ugb2YgdGhlIGN1cnJlbnQgc2VsZWN0ZWQgZWxlbWVudFxuICAgICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcblxuICAgICAgLy8gR2V0IHRoZSByZWZlcmVuY2Ugb2YgdGhlIG5ldyBjcmVhdGVkIHRhYmxlXG4gICAgICBsZXQgbmV3VGFibGUgPSB0aGlzLmNyZWF0ZSh3aWR0aCwgaGVpZ3RoLCBnZXRTdWNjZXNzaXZlRWxlbWVudElkKEZJR1VSRV9UQUJMRV9TRUxFQ1RPUiwgVEFCTEVfU1VGRklYKSlcblxuICAgICAgLy8gQmVnaW4gYXRvbWljIFVORE8gbGV2ZWwgXG4gICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHNlbGVjdGVkIGVsZW1lbnQgaXMgbm90IGVtcHR5LCBhbmQgYWRkIHRhYmxlIGFmdGVyXG4gICAgICAgIGlmIChzZWxlY3RlZEVsZW1lbnQudGV4dCgpLnRyaW0oKS5sZW5ndGggIT0gMCkge1xuXG4gICAgICAgICAgLy8gSWYgc2VsZWN0aW9uIGlzIGF0IHN0YXJ0IG9mIHRoZSBzZWxlY3RlZCBlbGVtZW50XG4gICAgICAgICAgaWYgKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKS5zdGFydE9mZnNldCA9PSAwKVxuICAgICAgICAgICAgc2VsZWN0ZWRFbGVtZW50LmJlZm9yZShuZXdUYWJsZSlcblxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNlbGVjdGVkRWxlbWVudC5hZnRlcihuZXdUYWJsZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHNlbGVjdGVkIGVsZW1lbnQgaXMgZW1wdHksIHJlcGxhY2UgaXQgd2l0aCB0aGUgbmV3IHRhYmxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzZWxlY3RlZEVsZW1lbnQucmVwbGFjZVdpdGgobmV3VGFibGUpXG5cbiAgICAgICAgLy8gU2F2ZSB1cGRhdGVzIFxuICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcblxuICAgICAgICAvLyBVcGRhdGUgYWxsIGNhcHRpb25zIHdpdGggUkFTSCBmdW5jdGlvblxuICAgICAgICBjYXB0aW9ucygpXG5cbiAgICAgICAgLy8gVXBkYXRlIFJlbmRlcmVkIFJBU0hcbiAgICAgICAgdXBkYXRlSWZyYW1lRnJvbVNhdmVkQ29udGVudCgpXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgdGhlIG5ldyB0YWJsZSB1c2luZyBwYXNzZWQgd2lkdGggYW5kIGhlaWdodFxuICAgICAqL1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGlkKSB7XG5cbiAgICAgIC8vIElmIHdpZHRoIGFuZCBoZWlndGggYXJlIHBvc2l0aXZlXG4gICAgICB0cnkge1xuICAgICAgICBpZiAod2lkdGggPiAwICYmIGhlaWdodCA+IDApIHtcblxuICAgICAgICAgIC8vIENyZWF0ZSBmaWd1cmUgYW5kIHRhYmxlXG4gICAgICAgICAgbGV0IGZpZ3VyZSA9ICQoYDxmaWd1cmUgaWQ9XCIke2lkfVwiPjwvZmlndXJlPmApXG4gICAgICAgICAgbGV0IHRhYmxlID0gJChgPHRhYmxlPjwvdGFibGU+YClcblxuICAgICAgICAgIC8vIFBvcHVsYXRlIHdpdGggd2lkdGggJiBoZWlndGhcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBoZWlnaHQ7IGkrKykge1xuXG4gICAgICAgICAgICBsZXQgcm93ID0gJChgPHRyPjwvdHI+YClcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuXG4gICAgICAgICAgICAgIGlmIChpID09IDApXG4gICAgICAgICAgICAgICAgcm93LmFwcGVuZChgPHRoPkhlYWRpbmcgY2VsbCAke3grMX08L3RoPmApXG5cbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoYDx0ZD48cD5EYXRhIGNlbGwgJHt4KzF9PC9wPjwvdGQ+YClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFibGUuYXBwZW5kKHJvdylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmaWd1cmUuYXBwZW5kKHRhYmxlKVxuICAgICAgICAgIGZpZ3VyZS5hcHBlbmQoYDxmaWdjYXB0aW9uPkNhcHRpb24uPC9maWdjYXB0aW9uPmApXG5cbiAgICAgICAgICByZXR1cm4gZmlndXJlXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICB9XG59KVxuXG4vKipcbiAqIFJhamVfZmlndXJlXG4gKi9cbnRpbnltY2UuUGx1Z2luTWFuYWdlci5hZGQoJ3JhamVfaW1hZ2UnLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcblxuICAvLyBBZGQgYSBidXR0b24gdGhhdCBoYW5kbGUgdGhlIGlubGluZSBlbGVtZW50XG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfaW1hZ2UnLCB7XG4gICAgdGl0bGU6ICdyYWplX2ltYWdlJyxcbiAgICBpY29uOiAnaWNvbi1pbWFnZScsXG4gICAgdG9vbHRpcDogJ0ltYWdlIGJsb2NrJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IERJU0FCTEVfU0VMRUNUT1JfRklHVVJFUyxcblxuICAgIC8vIEJ1dHRvbiBiZWhhdmlvdXJcbiAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIGxldCBmaWxlbmFtZSA9IHNlbGVjdEltYWdlKClcblxuICAgICAgaWYgKGZpbGVuYW1lICE9IG51bGwpXG4gICAgICAgIGltYWdlLmFkZChmaWxlbmFtZSwgZmlsZW5hbWUpXG4gICAgfVxuICB9KVxuXG4gIC8vIEJlY2F1c2Ugc29tZSBiZWhhdmlvdXJzIGFyZW4ndCBhY2NlcHRlZCwgUkFKRSBtdXN0IGNoZWNrIHNlbGVjdGlvbiBhbmQgYWNjZXB0IGJhY2tzcGFjZSwgY2FuYyBhbmQgZW50ZXIgcHJlc3NcbiAgZWRpdG9yLm9uKCdrZXlEb3duJywgZnVuY3Rpb24gKGUpIHtcblxuICAgIC8vIGtleUNvZGUgOCBpcyBiYWNrc3BhY2VcbiAgICBpZiAoZS5rZXlDb2RlID09IDgpXG4gICAgICByZXR1cm4gaGFuZGxlRmlndXJlRGVsZXRlKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcblxuICAgIGlmIChlLmtleUNvZGUgPT0gNDYpXG4gICAgICByZXR1cm4gaGFuZGxlRmlndXJlQ2FuYyh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24pXG5cbiAgICAvLyBIYW5kbGUgZW50ZXIga2V5IGluIGZpZ2NhcHRpb25cbiAgICBpZiAoZS5rZXlDb2RlID09IDEzKVxuICAgICAgcmV0dXJuIGhhbmRsZUZpZ3VyZUVudGVyKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcbiAgfSlcblxuICBpbWFnZSA9IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24gKHVybCwgYWx0KSB7XG5cbiAgICAgIC8vIEdldCB0aGUgcmVmZXJlY2Ugb2YgdGhlIHNlbGVjdGVkIGVsZW1lbnRcbiAgICAgIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpXG4gICAgICBsZXQgbmV3RmlndXJlID0gdGhpcy5jcmVhdGUodXJsLCBhbHQsIGdldFN1Y2Nlc3NpdmVFbGVtZW50SWQoRklHVVJFX0lNQUdFX1NFTEVDVE9SLCBJTUFHRV9TVUZGSVgpKVxuXG4gICAgICAvLyBCZWdpbiBhdG9taWMgVU5ETyBsZXZlbCBcbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgc2VsZWN0ZWQgZWxlbWVudCBpcyBub3QgZW1wdHksIGFuZCBhZGQgdGFibGUgYWZ0ZXJcbiAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCAhPSAwKSB7XG5cbiAgICAgICAgICAvLyBJZiBzZWxlY3Rpb24gaXMgYXQgc3RhcnQgb2YgdGhlIHNlbGVjdGVkIGVsZW1lbnRcbiAgICAgICAgICBpZiAodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldFJuZygpLnN0YXJ0T2Zmc2V0ID09IDApXG4gICAgICAgICAgICBzZWxlY3RlZEVsZW1lbnQuYmVmb3JlKG5ld0ZpZ3VyZSlcblxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNlbGVjdGVkRWxlbWVudC5hZnRlcihuZXdGaWd1cmUpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBzZWxlY3RlZCBlbGVtZW50IGlzIGVtcHR5LCByZXBsYWNlIGl0IHdpdGggdGhlIG5ldyB0YWJsZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc2VsZWN0ZWRFbGVtZW50LnJlcGxhY2VXaXRoKG5ld0ZpZ3VyZSlcblxuICAgICAgICAvLyBTYXZlIHVwZGF0ZXMgXG4gICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICAgIC8vIFVwZGF0ZSBhbGwgY2FwdGlvbnMgd2l0aCBSQVNIIGZ1bmN0aW9uXG4gICAgICAgIGNhcHRpb25zKClcblxuICAgICAgICAvLyBVcGRhdGUgUmVuZGVyZWQgUkFTSFxuICAgICAgICB1cGRhdGVJZnJhbWVGcm9tU2F2ZWRDb250ZW50KClcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gKHVybCwgYWx0LCBpZCkge1xuICAgICAgcmV0dXJuICQoYDxmaWd1cmUgaWQ9XCIke2lkfVwiPjxwPjxpbWcgc3JjPVwiJHt1cmx9XCIgJHthbHQ/J2FsdD1cIicrYWx0KydcIic6Jyd9IC8+PC9wPjxmaWdjYXB0aW9uPkNhcHRpb24uPC9maWdjYXB0aW9uPjwvZmlndXJlPmApXG4gICAgfVxuICB9XG59KVxuXG4vKipcbiAqIFJhamVfZm9ybXVsYVxuICovXG5cbmZ1bmN0aW9uIG9wZW5Gb3JtdWxhRWRpdG9yKGZvcm11bGFWYWx1ZSwgY2FsbGJhY2spIHtcbiAgdGlueW1jZS5hY3RpdmVFZGl0b3Iud2luZG93TWFuYWdlci5vcGVuKHtcbiAgICAgIHRpdGxlOiAnTWF0aCBmb3JtdWxhIGVkaXRvcicsXG4gICAgICB1cmw6ICdqcy9yYWplLWNvcmUvcGx1Z2luL3JhamVfZm9ybXVsYS5odG1sJyxcbiAgICAgIHdpZHRoOiA4MDAsXG4gICAgICBoZWlnaHQ6IDUwMCxcbiAgICAgIG9uQ2xvc2U6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBsZXQgb3V0cHV0ID0gdGlueW1jZS5hY3RpdmVFZGl0b3IuZm9ybXVsYV9vdXRwdXRcblxuICAgICAgICAvLyBJZiBhdCBsZWFzdCBmb3JtdWxhIGlzIHdyaXR0ZW5cbiAgICAgICAgaWYgKG91dHB1dCAhPSBudWxsKSB7XG5cbiAgICAgICAgICAvLyBJZiBoYXMgaWQsIFJBSkUgbXVzdCB1cGRhdGUgaXRcbiAgICAgICAgICBpZiAob3V0cHV0LmZvcm11bGFfaWQpXG4gICAgICAgICAgICBmb3JtdWxhLnVwZGF0ZShvdXRwdXQuZm9ybXVsYV9zdmcsIG91dHB1dC5mb3JtdWxhX2lkKVxuXG4gICAgICAgICAgLy8gT3IgYWRkIGl0IG5vcm1hbGx5XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZm9ybXVsYS5hZGQob3V0cHV0LmZvcm11bGFfc3ZnKVxuXG4gICAgICAgICAgLy8gU2V0IGZvcm11bGEgbnVsbFxuICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmZvcm11bGFfb3V0cHV0ID0gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iud2luZG93TWFuYWdlci5jbG9zZSgpXG4gICAgICB9XG4gICAgfSxcbiAgICBmb3JtdWxhVmFsdWVcbiAgKVxufVxuXG50aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdyYWplX2Zvcm11bGEnLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcblxuICAvLyBBZGQgYSBidXR0b24gdGhhdCBoYW5kbGUgdGhlIGlubGluZSBlbGVtZW50XG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfZm9ybXVsYScsIHtcbiAgICB0aXRsZTogJ3JhamVfZm9ybXVsYScsXG4gICAgaWNvbjogJ2ljb24tZm9ybXVsYScsXG4gICAgdG9vbHRpcDogJ0Zvcm11bGEnLFxuICAgIGRpc2FibGVkU3RhdGVTZWxlY3RvcjogRElTQUJMRV9TRUxFQ1RPUl9GSUdVUkVTLFxuXG4gICAgLy8gQnV0dG9uIGJlaGF2aW91clxuICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgIG9wZW5Gb3JtdWxhRWRpdG9yKClcbiAgICB9XG4gIH0pXG5cbiAgLy8gQmVjYXVzZSBzb21lIGJlaGF2aW91cnMgYXJlbid0IGFjY2VwdGVkLCBSQUpFIG11c3QgY2hlY2sgc2VsZWN0aW9uIGFuZCBhY2NlcHQgYmFja3NwYWNlLCBjYW5jIGFuZCBlbnRlciBwcmVzc1xuICBlZGl0b3Iub24oJ2tleURvd24nLCBmdW5jdGlvbiAoZSkge1xuXG4gICAgLy8ga2V5Q29kZSA4IGlzIGJhY2tzcGFjZVxuICAgIGlmIChlLmtleUNvZGUgPT0gOClcbiAgICAgIHJldHVybiBoYW5kbGVGaWd1cmVEZWxldGUodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uKVxuXG4gICAgaWYgKGUua2V5Q29kZSA9PSA0NilcbiAgICAgIHJldHVybiBoYW5kbGVGaWd1cmVDYW5jKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcblxuICAgIC8vIEhhbmRsZSBlbnRlciBrZXkgaW4gZmlnY2FwdGlvblxuICAgIGlmIChlLmtleUNvZGUgPT0gMTMpXG4gICAgICByZXR1cm4gaGFuZGxlRmlndXJlRW50ZXIodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uKVxuICB9KVxuXG4gIGVkaXRvci5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpXG5cbiAgICAvLyBPcGVuIGZvcm11bGEgZWRpdG9yIGNsaWNraW5nIG9uIG1hdGggZm9ybXVsYXNcbiAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoRklHVVJFX1NFTEVDVE9SKS5sZW5ndGggJiYgc2VsZWN0ZWRFbGVtZW50LmNoaWxkcmVuKCdzdmdbcm9sZT1tYXRoXScpLmxlbmd0aCkge1xuXG4gICAgICBvcGVuRm9ybXVsYUVkaXRvcih7XG4gICAgICAgIGZvcm11bGFfdmFsOiBzZWxlY3RlZEVsZW1lbnQuY2hpbGRyZW4oJ3N2Z1tyb2xlPW1hdGhdJykuYXR0cignZGF0YS1tYXRoLW9yaWdpbmFsLWlucHV0JyksXG4gICAgICAgIGZvcm11bGFfaWQ6IHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKEZJR1VSRV9TRUxFQ1RPUikuYXR0cignaWQnKVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgZm9ybXVsYSA9IHtcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uIChmb3JtdWxhX3N2Zykge1xuXG4gICAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgICAgbGV0IG5ld0Zvcm11bGEgPSB0aGlzLmNyZWF0ZShmb3JtdWxhX3N2ZywgZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChgJHtGSUdVUkVfRk9STVVMQV9TRUxFQ1RPUn0sJHtJTkxJTkVfRk9STVVMQV9TRUxFQ1RPUn1gLCBGT1JNVUxBX1NVRkZJWCkpXG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgc2VsZWN0ZWQgZWxlbWVudCBpcyBub3QgZW1wdHksIGFuZCBhZGQgdGFibGUgYWZ0ZXJcbiAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCAhPSAwKVxuICAgICAgICAgIHNlbGVjdGVkRWxlbWVudC5hZnRlcihuZXdGb3JtdWxhKVxuXG4gICAgICAgIC8vIElmIHNlbGVjdGVkIGVsZW1lbnQgaXMgZW1wdHksIHJlcGxhY2UgaXQgd2l0aCB0aGUgbmV3IHRhYmxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzZWxlY3RlZEVsZW1lbnQucmVwbGFjZVdpdGgobmV3Rm9ybXVsYSlcblxuICAgICAgICAvLyBTYXZlIHVwZGF0ZXMgXG4gICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICAgIGNhcHRpb25zKClcblxuICAgICAgICAvLyBVcGRhdGUgUmVuZGVyZWQgUkFTSFxuICAgICAgICB1cGRhdGVJZnJhbWVGcm9tU2F2ZWRDb250ZW50KClcbiAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAoZm9ybXVsYV9zdmcsIGZvcm11bGFfaWQpIHtcblxuICAgICAgbGV0IHNlbGVjdGVkRmlndXJlID0gJChgIyR7Zm9ybXVsYV9pZH1gKVxuXG4gICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgc2VsZWN0ZWRGaWd1cmUuZmluZCgnc3ZnJykucmVwbGFjZVdpdGgoZm9ybXVsYV9zdmcpXG4gICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAoZm9ybXVsYV9zdmcsIGlkKSB7XG4gICAgICAvL3JldHVybiBgPGZpZ3VyZSBpZD1cIiR7aWR9XCI+PHA+PHNwYW4gcm9sZT1cIm1hdGhcIiBjb250ZW50ZWRpdGFibGU9XCJmYWxzZVwiPlxcYFxcYCR7Zm9ybXVsYV9pbnB1dH1cXGBcXGA8L3NwYW4+PC9wPjwvZmlndXJlPmBcbiAgICAgIHJldHVybiBgPGZpZ3VyZSBpZD1cIiR7aWR9XCI+PHA+PHNwYW4gY29udGVudGVkaXRhYmxlPVwiZmFsc2VcIj4ke2Zvcm11bGFfc3ZnWzBdLm91dGVySFRNTH08L3NwYW4+PC9wPjwvZmlndXJlPmBcbiAgICB9XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIG9wZW5JbmxpbmVGb3JtdWxhRWRpdG9yKGZvcm11bGFWYWx1ZSwgY2FsbGJhY2spIHtcbiAgdGlueW1jZS5hY3RpdmVFZGl0b3Iud2luZG93TWFuYWdlci5vcGVuKHtcbiAgICAgIHRpdGxlOiAnTWF0aCBmb3JtdWxhIGVkaXRvcicsXG4gICAgICB1cmw6ICdqcy9yYWplbWNlL3BsdWdpbi9yYWplX2Zvcm11bGEuaHRtbCcsXG4gICAgICB3aWR0aDogODAwLFxuICAgICAgaGVpZ2h0OiA1MDAsXG4gICAgICBvbkNsb3NlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgbGV0IG91dHB1dCA9IHRpbnltY2UuYWN0aXZlRWRpdG9yLmZvcm11bGFfb3V0cHV0XG5cbiAgICAgICAgLy8gSWYgYXQgbGVhc3QgZm9ybXVsYSBpcyB3cml0dGVuXG4gICAgICAgIGlmIChvdXRwdXQgIT0gbnVsbCkge1xuXG4gICAgICAgICAgLy8gSWYgaGFzIGlkLCBSQUpFIG11c3QgdXBkYXRlIGl0XG4gICAgICAgICAgaWYgKG91dHB1dC5mb3JtdWxhX2lkKVxuICAgICAgICAgICAgaW5saW5lX2Zvcm11bGEudXBkYXRlKG91dHB1dC5mb3JtdWxhX3N2Zywgb3V0cHV0LmZvcm11bGFfaWQpXG5cbiAgICAgICAgICAvLyBPciBhZGQgaXQgbm9ybWFsbHlcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmxpbmVfZm9ybXVsYS5hZGQob3V0cHV0LmZvcm11bGFfc3ZnKVxuXG4gICAgICAgICAgLy8gU2V0IGZvcm11bGEgbnVsbFxuICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmZvcm11bGFfb3V0cHV0ID0gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iud2luZG93TWFuYWdlci5jbG9zZSgpXG4gICAgICB9XG4gICAgfSxcbiAgICBmb3JtdWxhVmFsdWVcbiAgKVxufVxuXG50aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdyYWplX2lubGluZV9mb3JtdWxhJywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG5cbiAgZWRpdG9yLmFkZEJ1dHRvbigncmFqZV9pbmxpbmVfZm9ybXVsYScsIHtcbiAgICBpY29uOiAnaWNvbi1pbmxpbmUtZm9ybXVsYScsXG4gICAgdG9vbHRpcDogJ0lubGluZSBmb3JtdWxhJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IGAke0RJU0FCTEVfU0VMRUNUT1JfSU5MSU5FfSw6aGVhZGVyYCxcblxuICAgIC8vIEJ1dHRvbiBiZWhhdmlvdXJcbiAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICBvcGVuSW5saW5lRm9ybXVsYUVkaXRvcigpXG4gICAgfVxuICB9KVxuXG4gIGVkaXRvci5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpXG5cbiAgICAvLyBPcGVuIGZvcm11bGEgZWRpdG9yIGNsaWNraW5nIG9uIG1hdGggZm9ybXVsYXNcbiAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmNoaWxkcmVuKCdzdmdbcm9sZT1tYXRoXScpLmxlbmd0aCkge1xuXG4gICAgICBvcGVuSW5saW5lRm9ybXVsYUVkaXRvcih7XG4gICAgICAgIGZvcm11bGFfdmFsOiBzZWxlY3RlZEVsZW1lbnQuY2hpbGRyZW4oJ3N2Z1tyb2xlPW1hdGhdJykuYXR0cignZGF0YS1tYXRoLW9yaWdpbmFsLWlucHV0JyksXG4gICAgICAgIGZvcm11bGFfaWQ6IHNlbGVjdGVkRWxlbWVudC5hdHRyKCdpZCcpXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBpbmxpbmVfZm9ybXVsYSA9IHtcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uIChmb3JtdWxhX3N2Zykge1xuXG4gICAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgICAgbGV0IG5ld0Zvcm11bGEgPSB0aGlzLmNyZWF0ZShmb3JtdWxhX3N2ZywgZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChgJHtGSUdVUkVfRk9STVVMQV9TRUxFQ1RPUn0sJHtJTkxJTkVfRk9STVVMQV9TRUxFQ1RPUn1gLCBGT1JNVUxBX1NVRkZJWCkpXG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2V0Q29udGVudChuZXdGb3JtdWxhKVxuXG4gICAgICAgIC8vIFNhdmUgdXBkYXRlcyBcbiAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG5cbiAgICAgICAgY2FwdGlvbnMoKVxuXG4gICAgICAgIC8vIFVwZGF0ZSBSZW5kZXJlZCBSQVNIXG4gICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgfSlcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIChmb3JtdWxhX3N2ZywgZm9ybXVsYV9pZCkge1xuXG4gICAgICBsZXQgc2VsZWN0ZWRGaWd1cmUgPSAkKGAjJHtmb3JtdWxhX2lkfWApXG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBzZWxlY3RlZEZpZ3VyZS5maW5kKCdzdmcnKS5yZXBsYWNlV2l0aChmb3JtdWxhX3N2ZylcbiAgICAgICAgdXBkYXRlSWZyYW1lRnJvbVNhdmVkQ29udGVudCgpXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChmb3JtdWxhX3N2ZywgaWQpIHtcbiAgICAgIHJldHVybiBgPHNwYW4gaWQ9XCIke2lkfVwiIGNvbnRlbnRlZGl0YWJsZT1cImZhbHNlXCI+JHtmb3JtdWxhX3N2Z1swXS5vdXRlckhUTUx9PC9zcGFuPmBcbiAgICB9XG4gIH1cbn0pXG5cbi8qKlxuICogUmFqZV9saXN0aW5nXG4gKi9cbnRpbnltY2UuUGx1Z2luTWFuYWdlci5hZGQoJ3JhamVfbGlzdGluZycsIGZ1bmN0aW9uIChlZGl0b3IsIHVybCkge1xuXG4gIC8vIEFkZCBhIGJ1dHRvbiB0aGF0IGhhbmRsZSB0aGUgaW5saW5lIGVsZW1lbnRcbiAgZWRpdG9yLmFkZEJ1dHRvbigncmFqZV9saXN0aW5nJywge1xuICAgIHRpdGxlOiAncmFqZV9saXN0aW5nJyxcbiAgICBpY29uOiAnaWNvbi1saXN0aW5nJyxcbiAgICB0b29sdGlwOiAnTGlzdGluZycsXG4gICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yOiBESVNBQkxFX1NFTEVDVE9SX0ZJR1VSRVMsXG5cbiAgICAvLyBCdXR0b24gYmVoYXZpb3VyXG4gICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgbGlzdGluZy5hZGQoKVxuICAgIH1cbiAgfSlcblxuXG5cbiAgLy8gQmVjYXVzZSBzb21lIGJlaGF2aW91cnMgYXJlbid0IGFjY2VwdGVkLCBSQUpFIG11c3QgY2hlY2sgc2VsZWN0aW9uIGFuZCBhY2NlcHQgYmFja3NwYWNlLCBjYW5jIGFuZCBlbnRlciBwcmVzc1xuICBlZGl0b3Iub24oJ2tleURvd24nLCBmdW5jdGlvbiAoZSkge1xuXG4gICAgLyoqXG4gICAgICogTk9URTogdGhpcyBiZWh2YWlvdXIgaXMgdGhlIHNhbWUgZm9yIGNvZGVibG9ja1xuICAgICAqL1xuICAgIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpXG4gICAgaWYgKHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKCdwcmU6aGFzKGNvZGUpJykubGVuZ3RoKSB7XG5cbiAgICAgIC8qKlxuICAgICAgICogUHJvcGVyIGxpc3RpbmcgZWRpdG9yIGJlaGF2aW91clxuICAgICAgICovXG4gICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKCdjb2RlJykpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRU5URVJcbiAgICAgICAgICovXG4gICAgICAgIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICByZXR1cm4gbGlzdGluZy5zZXRDb250ZW50KGBcXG4ke1pFUk9fU1BBQ0V9YClcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUQUJcbiAgICAgICAgICovXG4gICAgICAgIGlmIChlLmtleUNvZGUgPT0gOSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIHJldHVybiBsaXN0aW5nLnNldENvbnRlbnQoYFxcdGApXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGUua2V5Q29kZSA9PSAxMylcbiAgICAgICAgcmV0dXJuIGhhbmRsZUZpZ3VyZUVudGVyKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcblxuICAgICAgLy8ga2V5Q29kZSA4IGlzIGJhY2tzcGFjZVxuICAgICAgaWYgKGUua2V5Q29kZSA9PSA4KVxuICAgICAgICByZXR1cm4gaGFuZGxlRmlndXJlRGVsZXRlKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcblxuICAgICAgLypcbiAgICAgIC8vIGtleUNvZGUgOCBpcyBiYWNrc3BhY2VcbiAgICAgIGlmIChlLmtleUNvZGUgPT0gOClcbiAgICAgICAgcmV0dXJuIGhhbmRsZUZpZ3VyZURlbGV0ZSh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24pXG5cbiAgICAgIGlmIChlLmtleUNvZGUgPT0gNDYpXG4gICAgICAgIHJldHVybiBoYW5kbGVGaWd1cmVDYW5jKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbilcblxuICAgICAgLy8gSGFuZGxlIGVudGVyIGtleSBpbiBmaWdjYXB0aW9uXG4gICAgICBpZiAoZS5rZXlDb2RlID09IDEzKVxuICAgICAgICByZXR1cm4gaGFuZGxlRmlndXJlRW50ZXIodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uKVxuICAgICAgICAqL1xuICAgIH1cbiAgICAvKlxuICAgIGlmIChlLmtleUNvZGUgPT0gOSkge1xuICAgICAgaWYgKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5pc0NvbGxhcHNlZCgpICYmICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSkucGFyZW50cyhgY29kZSwke0ZJR1VSRV9TRUxFQ1RPUn1gKS5sZW5ndGgpIHtcbiAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldENvbnRlbnQoJ1xcdCcpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlLmtleUNvZGUgPT0gMzcpIHtcbiAgICAgIGxldCByYW5nZSA9IHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKVxuICAgICAgbGV0IHN0YXJ0Tm9kZSA9ICQocmFuZ2Uuc3RhcnRDb250YWluZXIpXG4gICAgICBpZiAoc3RhcnROb2RlLnBhcmVudCgpLmlzKCdjb2RlJykgJiYgKHN0YXJ0Tm9kZS5wYXJlbnQoKS5jb250ZW50cygpLmluZGV4KHN0YXJ0Tm9kZSkgPT0gMCAmJiByYW5nZS5zdGFydE9mZnNldCA9PSAxKSkge1xuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2V0Q3Vyc29yTG9jYXRpb24oc3RhcnROb2RlLnBhcmVudHMoRklHVVJFX1NFTEVDVE9SKS5wcmV2KCdwLDpoZWFkZXInKVswXSwgMSlcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSovXG4gIH0pXG5cbiAgbGlzdGluZyA9IHtcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcbiAgICAgIGxldCBuZXdMaXN0aW5nID0gdGhpcy5jcmVhdGUoZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChGSUdVUkVfTElTVElOR19TRUxFQ1RPUiwgTElTVElOR19TVUZGSVgpKVxuXG4gICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHNlbGVjdGVkIHBhcmFncmFwaCBpcyBub3QgZW1wdHksIGFkZCB0aGUgbmV3IGxpc3RpbmcgcmlnaHQgYmVsb3dcbiAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCAhPSAwKVxuICAgICAgICAgIHNlbGVjdGVkRWxlbWVudC5hZnRlcihuZXdMaXN0aW5nKVxuXG4gICAgICAgIC8vIElmIHNlbGVjdGVkIHBhcmFncmFwaCBpcyBlbXB0eSwgcmVwbGFjZSBpdCB3aXRoIHRoZSBuZXcgdGFibGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNlbGVjdGVkRWxlbWVudC5yZXBsYWNlV2l0aChuZXdMaXN0aW5nKVxuXG4gICAgICAgIC8vIFNhdmUgdXBkYXRlcyBcbiAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG5cbiAgICAgICAgLy8gVXBkYXRlIGFsbCBjYXB0aW9ucyB3aXRoIFJBU0ggZnVuY3Rpb25cbiAgICAgICAgY2FwdGlvbnMoKVxuXG4gICAgICAgIC8vIE1vdmUgdGhlIGNhcmV0XG4gICAgICAgIHNlbGVjdFJhbmdlKG5ld0xpc3RpbmcuZmluZCgnY29kZScpWzBdLCAwKVxuXG4gICAgICAgIC8vIFVwZGF0ZSBSZW5kZXJlZCBSQVNIXG4gICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgfSlcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgcmV0dXJuICQoYDxmaWd1cmUgaWQ9XCIke2lkfVwiPjxwcmU+PGNvZGU+JHtaRVJPX1NQQUNFfTwvY29kZT48L3ByZT48ZmlnY2FwdGlvbj5DYXB0aW9uLjwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5gKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBzZXRDb250ZW50OiBmdW5jdGlvbiAoY2hhcikge1xuICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldENvbnRlbnQoY2hhcilcbiAgICB9XG4gIH1cbn0pXG5cbi8qKlxuICogUmFqZSBjb2RlYmxvY2tcbiAqL1xudGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9jb2RlYmxvY2snLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcblxuICAvLyBBZGQgYSBidXR0b24gdGhhdCBoYW5kbGUgdGhlIGlubGluZSBlbGVtZW50XG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfY29kZWJsb2NrJywge1xuICAgIHRpdGxlOiAncmFqZV9jb2RlYmxvY2snLFxuICAgIGljb246ICdpY29uLWJsb2NrLWNvZGUnLFxuICAgIHRvb2x0aXA6ICdCbG9jayBjb2RlJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IGAke0RJU0FCTEVfU0VMRUNUT1JfRklHVVJFU30sY29kZSxwcmVgLFxuXG4gICAgLy8gQnV0dG9uIGJlaGF2aW91clxuICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGJsb2NrY29kZS5hZGQoKVxuICAgIH1cbiAgfSlcblxuICBibG9ja2NvZGUgPSB7XG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpXG4gICAgICBsZXQgYmxvY2tDb2RlID0gdGhpcy5jcmVhdGUoZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChGSUdVUkVfTElTVElOR19TRUxFQ1RPUiwgTElTVElOR19TVUZGSVgpKVxuXG4gICAgICBpZiAoIXNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKCdwcmUsY29kZScpLmxlbmd0aCkge1xuXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBzZWxlY3RlZCBwYXJhZ3JhcGggaXMgbm90IGVtcHR5LCBhZGQgdGhlIG5ldyBsaXN0aW5nIHJpZ2h0IGJlbG93XG4gICAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCAhPSAwKVxuICAgICAgICAgICAgc2VsZWN0ZWRFbGVtZW50LmFmdGVyKGJsb2NrQ29kZSlcblxuICAgICAgICAgIC8vIElmIHNlbGVjdGVkIHBhcmFncmFwaCBpcyBlbXB0eSwgcmVwbGFjZSBpdCB3aXRoIHRoZSBuZXcgdGFibGVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZWxlY3RlZEVsZW1lbnQucmVwbGFjZVdpdGgoYmxvY2tDb2RlKVxuXG4gICAgICAgICAgLy8gU2F2ZSB1cGRhdGVzIFxuICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICAgICAgLy8gVXBkYXRlIGFsbCBjYXB0aW9ucyB3aXRoIFJBU0ggZnVuY3Rpb25cbiAgICAgICAgICBjYXB0aW9ucygpXG5cbiAgICAgICAgICAvLyBNb3ZlIHRoZSBjYXJldFxuICAgICAgICAgIHNlbGVjdFJhbmdlKGJsb2NrQ29kZS5maW5kKCdjb2RlJylbMF0sIDApXG5cbiAgICAgICAgICAvLyBVcGRhdGUgUmVuZGVyZWQgUkFTSFxuICAgICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgcmV0dXJuICQoYDxwcmU+PGNvZGU+JHtaRVJPX1NQQUNFfTwvY29kZT48L3ByZT5gKVxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBSYWplIHF1b3RlYmxvY2tcbiAqL1xudGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9xdW90ZWJsb2NrJywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG5cbiAgLy8gQWRkIGEgYnV0dG9uIHRoYXQgaGFuZGxlIHRoZSBpbmxpbmUgZWxlbWVudFxuICBlZGl0b3IuYWRkQnV0dG9uKCdyYWplX3F1b3RlYmxvY2snLCB7XG4gICAgdGl0bGU6ICdyYWplX3F1b3RlYmxvY2snLFxuICAgIGljb246ICdpY29uLWJsb2NrLXF1b3RlJyxcbiAgICB0b29sdGlwOiAnQmxvY2sgcXVvdGUnLFxuICAgIGRpc2FibGVkU3RhdGVTZWxlY3RvcjogYCR7RElTQUJMRV9TRUxFQ1RPUl9GSUdVUkVTfSxibG9ja3F1b3RlYCxcblxuICAgIC8vIEJ1dHRvbiBiZWhhdmlvdXJcbiAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICBibG9ja3F1b3RlLmFkZCgpXG4gICAgfVxuICB9KVxuXG4gIGVkaXRvci5vbigna2V5RG93bicsIGZ1bmN0aW9uIChlKSB7XG5cbiAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJ3AnKSAmJiBzZWxlY3RlZEVsZW1lbnQucGFyZW50KCkuaXMoJ2Jsb2NrcXVvdGUnKSkge1xuXG4gICAgICAvKipcbiAgICAgICAqIEVudGVyXG4gICAgICAgKi9cbiAgICAgIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgICAgLy8gRXhpdCBmcm9tIHRoZSBibG9ja3F1b3RlIGlmIHRoZSBjdXJyZW50IHAgaXMgZW1wdHlcbiAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCA9PSAwKVxuICAgICAgICAgIHJldHVybiBibG9ja3F1b3RlLmV4aXQoKVxuXG4gICAgICAgIGJsb2NrcXVvdGUuYWRkUGFyYWdyYXBoKClcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgYmxvY2txdW90ZSA9IHtcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcbiAgICAgIGxldCBibG9ja1F1b3RlID0gdGhpcy5jcmVhdGUoZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChGSUdVUkVfTElTVElOR19TRUxFQ1RPUiwgTElTVElOR19TVUZGSVgpKVxuXG4gICAgICBpZiAoIXNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKCdwcmUsY29kZScpLmxlbmd0aCkge1xuXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBzZWxlY3RlZCBwYXJhZ3JhcGggaXMgbm90IGVtcHR5LCBhZGQgdGhlIG5ldyBsaXN0aW5nIHJpZ2h0IGJlbG93XG4gICAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCAhPSAwKVxuICAgICAgICAgICAgc2VsZWN0ZWRFbGVtZW50LmFmdGVyKGJsb2NrUXVvdGUpXG5cbiAgICAgICAgICAvLyBJZiBzZWxlY3RlZCBwYXJhZ3JhcGggaXMgZW1wdHksIHJlcGxhY2UgaXQgd2l0aCB0aGUgbmV3IHRhYmxlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2VsZWN0ZWRFbGVtZW50LnJlcGxhY2VXaXRoKGJsb2NrUXVvdGUpXG5cbiAgICAgICAgICAvLyBTYXZlIHVwZGF0ZXMgXG4gICAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG5cbiAgICAgICAgICAvLyBVcGRhdGUgYWxsIGNhcHRpb25zIHdpdGggUkFTSCBmdW5jdGlvblxuICAgICAgICAgIGNhcHRpb25zKClcblxuICAgICAgICAgIC8vIE1vdmUgdGhlIGNhcmV0XG4gICAgICAgICAgbW92ZUNhcmV0KGJsb2NrUXVvdGVbMF0pXG5cbiAgICAgICAgICAvLyBVcGRhdGUgUmVuZGVyZWQgUkFTSFxuICAgICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgcmV0dXJuICQoYDxibG9ja3F1b3RlPjxwPiR7WkVST19TUEFDRX08L3A+PC9ibG9ja3F1b3RlPmApXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGdldExhc3ROb3RFbXB0eU5vZGU6IGZ1bmN0aW9uIChub2Rlcykge1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICgobm9kZXNbaV0ubm9kZVR5cGUgPT0gMyB8fCBub2Rlc1tpXS50YWdOYW1lID09ICdicicpICYmICFub2Rlc1tpXS5sZW5ndGgpXG4gICAgICAgICAgbm9kZXMuc3BsaWNlKGksIDEpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2Rlc1tub2Rlcy5sZW5ndGggLSAxXVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBhZGRQYXJhZ3JhcGg6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgY29uc3QgQlIgPSAnPGJyPidcblxuICAgICAgLy8gR2V0IHRoZSByZWZlcmVuY2VzIG9mIHRoZSBleGlzdGluZyBlbGVtZW50XG4gICAgICBsZXQgcGFyYWdyYXBoID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuXG4gICAgICAvLyBQbGFjZWhvbGRlciB0ZXh0IG9mIHRoZSBuZXcgbGlcbiAgICAgIGxldCB0ZXh0ID0gQlJcbiAgICAgIGxldCB0ZXh0Tm9kZXMgPSBwYXJhZ3JhcGguY29udGVudHMoKVxuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBqdXN0IG9uZSBub2RlIHdyYXBwZWQgaW5zaWRlIHRoZSBwYXJhZ3JhcGhcbiAgICAgIGlmICh0ZXh0Tm9kZXMubGVuZ3RoID09IDEpIHtcblxuICAgICAgICAvLyBHZXQgdGhlIHN0YXJ0IG9mZnNldCBhbmQgdGV4dCBvZiB0aGUgY3VycmVudCBsaVxuICAgICAgICBsZXQgc3RhcnRPZmZzZXQgPSB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuc3RhcnRPZmZzZXRcbiAgICAgICAgbGV0IHdob2xlVGV4dCA9IHBhcmFncmFwaC50ZXh0KClcblxuICAgICAgICAvLyBJZiB0aGUgY3Vyc29yIGlzbid0IGF0IHRoZSBlbmQgYnV0IGl0J3MgaW4gdGhlIG1pZGRsZVxuICAgICAgICAvLyBHZXQgdGhlIHJlbWFpbmluZyB0ZXh0IGZyb20gdGhlIGN1cnNvciB0byB0aGUgZW5kXG4gICAgICAgIGlmIChzdGFydE9mZnNldCAhPSB3aG9sZVRleHQubGVuZ3RoKVxuICAgICAgICAgIHRleHQgPSB3aG9sZVRleHQuc3Vic3RyaW5nKHN0YXJ0T2Zmc2V0LCB3aG9sZVRleHQubGVuZ3RoKVxuXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgdGV4dCBvZiB0aGUgY3VycmVudCBsaVxuICAgICAgICAgIHBhcmFncmFwaC50ZXh0KHdob2xlVGV4dC5zdWJzdHJpbmcoMCwgc3RhcnRPZmZzZXQpKVxuXG4gICAgICAgICAgaWYgKCFwYXJhZ3JhcGgudGV4dCgpLmxlbmd0aClcbiAgICAgICAgICAgIHBhcmFncmFwaC5odG1sKEJSKVxuXG4gICAgICAgICAgLy8gQ3JlYXRlIGFuZCBhZGQgdGhlIG5ldyBsaVxuICAgICAgICAgIGxldCBuZXdQYXJhZ3JhcGggPSAkKGA8cD4ke3RleHR9PC9wPmApXG4gICAgICAgICAgcGFyYWdyYXBoLmFmdGVyKG5ld1BhcmFncmFwaClcblxuICAgICAgICAgIC8vIE1vdmUgdGhlIGNhcmV0IHRvIHRoZSBuZXcgbGlcbiAgICAgICAgICBtb3ZlQ2FyZXQobmV3UGFyYWdyYXBoWzBdLCB0cnVlKVxuXG4gICAgICAgICAgLy8gVXBkYXRlIHRoZSBjb250ZW50XG4gICAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIC8vIEluc3RlYWQgaWYgdGhlcmUgYXJlIG11bHRpcGxlIG5vZGVzIGluc2lkZSB0aGUgcGFyYWdyYXBoXG4gICAgICBlbHNlIHtcblxuICAgICAgICAvLyBJc3RhbnRpYXRlIHRoZSByYW5nZSB0byBiZSBzZWxlY3RlZFxuICAgICAgICBsZXQgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpXG5cbiAgICAgICAgLy8gU3RhcnQgdGhlIHJhbmdlIGZyb20gdGhlIHNlbGVjdGVkIG5vZGUgYW5kIG9mZnNldCBhbmQgZW5kcyBpdCBhdCB0aGUgZW5kIG9mIHRoZSBsYXN0IG5vZGVcbiAgICAgICAgcmFuZ2Uuc2V0U3RhcnQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldFJuZygpLnN0YXJ0Q29udGFpbmVyLCB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuc3RhcnRPZmZzZXQpXG4gICAgICAgIHJhbmdlLnNldEVuZCh0aGlzLmdldExhc3ROb3RFbXB0eU5vZGUodGV4dE5vZGVzKSwgMSlcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIHJhbmdlXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRSbmcocmFuZ2UpXG5cbiAgICAgICAgLy8gU2F2ZSB0aGUgaHRtbCBjb250ZW50XG4gICAgICAgIHdob2xlVGV4dCA9IHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRDb250ZW50KClcblxuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICBwYXJhZ3JhcGguaHRtbChwYXJhZ3JhcGguaHRtbCgpLnJlcGxhY2Uod2hvbGVUZXh0LCAnJykpXG5cbiAgICAgICAgICBpZiAoIXBhcmFncmFwaC50ZXh0KCkubGVuZ3RoKVxuICAgICAgICAgICAgcGFyYWdyYXBoLmh0bWwoQlIpXG5cbiAgICAgICAgICAvLyBDcmVhdGUgYW5kIGFkZCB0aGUgbmV3IGxpXG4gICAgICAgICAgbGV0IG5ld1BhcmFncmFwaCA9ICQoYDxwPiR7d2hvbGVUZXh0fTwvcD5gKVxuICAgICAgICAgIHBhcmFncmFwaC5hZnRlcihuZXdQYXJhZ3JhcGgpXG5cbiAgICAgICAgICAvLyBNb3ZlIHRoZSBjYXJldCB0byB0aGUgbmV3IGxpXG4gICAgICAgICAgbW92ZUNhcmV0KG5ld1BhcmFncmFwaFswXSwgdHJ1ZSlcblxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgY29udGVudFxuICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBleGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcGFyYWdyYXBoID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgICAgbGV0IGJsb2NrcXVvdGUgPSBwYXJhZ3JhcGgucGFyZW50KClcblxuICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHBhcmFncmFwaC5yZW1vdmUoKVxuXG4gICAgICAgIGlmICghYmxvY2txdW90ZS5uZXh0KCkubGVuZ3RoKSB7XG4gICAgICAgICAgYmxvY2txdW90ZS5hZnRlcigkKGA8cD48YnIvPjwvcD5gKSlcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdmVDYXJldChibG9ja3F1b3RlLm5leHQoKVswXSlcblxuICAgICAgfSlcbiAgICB9XG4gIH1cbn0pXG5cbi8qKlxuICogVXBkYXRlIHRhYmxlIGNhcHRpb25zIHdpdGggYSBSQVNIIGZ1bmNpb24gXG4gKi9cbmZ1bmN0aW9uIGNhcHRpb25zKCkge1xuXG4gIC8qIENhcHRpb25zICovXG4gICQoZmlndXJlYm94X3NlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY3VyX2NhcHRpb24gPSAkKHRoaXMpLnBhcmVudHMoXCJmaWd1cmVcIikuZmluZChcImZpZ2NhcHRpb25cIik7XG4gICAgdmFyIGN1cl9udW1iZXIgPSAkKHRoaXMpLmZpbmROdW1iZXIoZmlndXJlYm94X3NlbGVjdG9yKTtcbiAgICBjdXJfY2FwdGlvbi5maW5kKCdzdHJvbmcnKS5yZW1vdmUoKTtcbiAgICBjdXJfY2FwdGlvbi5odG1sKFwiPHN0cm9uZyBjbGFzcz1cXFwiY2dlblxcXCIgZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQ9XFxcIlxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJmYWxzZVxcXCI+RmlndXJlIFwiICsgY3VyX251bWJlciArXG4gICAgICBcIi4gPC9zdHJvbmc+XCIgKyBjdXJfY2FwdGlvbi5odG1sKCkpO1xuICB9KTtcbiAgJCh0YWJsZWJveF9zZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cl9jYXB0aW9uID0gJCh0aGlzKS5wYXJlbnRzKFwiZmlndXJlXCIpLmZpbmQoXCJmaWdjYXB0aW9uXCIpO1xuICAgIHZhciBjdXJfbnVtYmVyID0gJCh0aGlzKS5maW5kTnVtYmVyKHRhYmxlYm94X3NlbGVjdG9yKTtcbiAgICBjdXJfY2FwdGlvbi5maW5kKCdzdHJvbmcnKS5yZW1vdmUoKTtcbiAgICBjdXJfY2FwdGlvbi5odG1sKFwiPHN0cm9uZyBjbGFzcz1cXFwiY2dlblxcXCIgZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQ9XFxcIlxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJmYWxzZVxcXCIgPlRhYmxlIFwiICsgY3VyX251bWJlciArXG4gICAgICBcIi4gPC9zdHJvbmc+XCIgKyBjdXJfY2FwdGlvbi5odG1sKCkpO1xuICB9KTtcbiAgJChmb3JtdWxhYm94X3NlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY3VyX2NhcHRpb24gPSAkKHRoaXMpLnBhcmVudHMoXCJmaWd1cmVcIikuZmluZChcInBcIik7XG4gICAgdmFyIGN1cl9udW1iZXIgPSAkKHRoaXMpLmZpbmROdW1iZXIoZm9ybXVsYWJveF9zZWxlY3Rvcik7XG4gICAgY3VyX2NhcHRpb24uZmluZCgnc3Bhbi5jZ2VuJykucmVtb3ZlKCk7XG4gICAgY3VyX2NhcHRpb24uaHRtbChjdXJfY2FwdGlvbi5odG1sKCkgKyBcIjxzcGFuIGNvbnRlbnRlZGl0YWJsZT1cXFwiZmFsc2VcXFwiIGNsYXNzPVxcXCJjZ2VuXFxcIiBkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudD1cXFwiXFxcIiA+IChcIiArXG4gICAgICBjdXJfbnVtYmVyICsgXCIpPC9zcGFuPlwiKTtcbiAgfSk7XG4gICQobGlzdGluZ2JveF9zZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cl9jYXB0aW9uID0gJCh0aGlzKS5wYXJlbnRzKFwiZmlndXJlXCIpLmZpbmQoXCJmaWdjYXB0aW9uXCIpO1xuICAgIHZhciBjdXJfbnVtYmVyID0gJCh0aGlzKS5maW5kTnVtYmVyKGxpc3Rpbmdib3hfc2VsZWN0b3IpO1xuICAgIGN1cl9jYXB0aW9uLmZpbmQoJ3N0cm9uZycpLnJlbW92ZSgpO1xuICAgIGN1cl9jYXB0aW9uLmh0bWwoXCI8c3Ryb25nIGNsYXNzPVxcXCJjZ2VuXFxcIiBkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudD1cXFwiXFxcIiBjb250ZW50ZWRpdGFibGU9XFxcImZhbHNlXFxcIj5MaXN0aW5nIFwiICsgY3VyX251bWJlciArXG4gICAgICBcIi4gPC9zdHJvbmc+XCIgKyBjdXJfY2FwdGlvbi5odG1sKCkpO1xuICB9KTtcbiAgLyogL0VORCBDYXB0aW9ucyAqL1xufVxuXG4vKipcbiAqIFxuICogQHBhcmFtIHsqfSBzZWwgPT4gdGlueW1jZSBzZWxlY3Rpb25cbiAqIFxuICogTWFpbmx5IGl0IGNoZWNrcyB3aGVyZSBzZWxlY3Rpb24gc3RhcnRzIGFuZCBlbmRzIHRvIGJsb2NrIHVuYWxsb3dlZCBkZWxldGlvblxuICogSW4gc2FtZSBmaWd1cmUgYXJlbid0IGJsb2NrZWQsIHVubGVzcyBzZWxlY3Rpb24gc3RhcnQgT1IgZW5kIGluc2lkZSBmaWdjYXB0aW9uIChub3QgYm90aClcbiAqL1xuZnVuY3Rpb24gaGFuZGxlRmlndXJlRGVsZXRlKHNlbCkge1xuXG4gIHRyeSB7XG5cbiAgICAvLyBHZXQgcmVmZXJlbmNlIG9mIHN0YXJ0IGFuZCBlbmQgbm9kZVxuICAgIGxldCBzdGFydE5vZGUgPSAkKHNlbC5nZXRSbmcoKS5zdGFydENvbnRhaW5lcilcbiAgICBsZXQgc3RhcnROb2RlUGFyZW50ID0gc3RhcnROb2RlLnBhcmVudHMoRklHVVJFX1NFTEVDVE9SKVxuXG4gICAgbGV0IGVuZE5vZGUgPSAkKHNlbC5nZXRSbmcoKS5lbmRDb250YWluZXIpXG4gICAgbGV0IGVuZE5vZGVQYXJlbnQgPSBlbmROb2RlLnBhcmVudHMoRklHVVJFX1NFTEVDVE9SKVxuXG4gICAgLy8gSWYgYXQgbGVhc3Qgc2VsZWN0aW9uIHN0YXJ0IG9yIGVuZCBpcyBpbnNpZGUgdGhlIGZpZ3VyZVxuICAgIGlmIChzdGFydE5vZGVQYXJlbnQubGVuZ3RoIHx8IGVuZE5vZGVQYXJlbnQubGVuZ3RoKSB7XG5cbiAgICAgIC8vIElmIHNlbGVjdGlvbiB3cmFwcyBlbnRpcmVseSBhIGZpZ3VyZSBmcm9tIHRoZSBzdGFydCBvZiBmaXJzdCBlbGVtZW50ICh0aCBpbiB0YWJsZSkgYW5kIHNlbGVjdGlvbiBlbmRzXG4gICAgICBpZiAoZW5kTm9kZS5wYXJlbnRzKCdmaWdjYXB0aW9uJykubGVuZ3RoKSB7XG5cbiAgICAgICAgbGV0IGNvbnRlbnRzID0gZW5kTm9kZS5wYXJlbnQoKS5jb250ZW50cygpXG4gICAgICAgIGlmIChzdGFydE5vZGUuaXMoRklHVVJFX1NFTEVDVE9SKSAmJiBjb250ZW50cy5pbmRleChlbmROb2RlKSA9PSBjb250ZW50cy5sZW5ndGggLSAxICYmIHNlbC5nZXRSbmcoKS5lbmRPZmZzZXQgPT0gZW5kTm9kZS50ZXh0KCkubGVuZ3RoKSB7XG4gICAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAvLyBNb3ZlIGN1cnNvciBhdCB0aGUgcHJldmlvdXMgZWxlbWVudCBhbmQgcmVtb3ZlIGZpZ3VyZVxuICAgICAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IuZm9jdXMoKVxuICAgICAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldEN1cnNvckxvY2F0aW9uKHN0YXJ0Tm9kZS5wcmV2KClbMF0sIDEpXG4gICAgICAgICAgICBzdGFydE5vZGUucmVtb3ZlKClcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBzZWxlY3Rpb24gZG9lc24ndCBzdGFydCBhbmQgZW5kIGluIHRoZSBzYW1lIGZpZ3VyZSwgYnV0IG9uZSBiZWV0d2VuIHN0YXJ0IG9yIGVuZCBpcyBpbnNpZGUgdGhlIGZpZ2NhcHRpb24sIG11c3QgYmxvY2tcbiAgICAgIGlmIChzdGFydE5vZGUucGFyZW50cygnZmlnY2FwdGlvbicpLmxlbmd0aCAhPSBlbmROb2RlLnBhcmVudHMoJ2ZpZ2NhcHRpb24nKS5sZW5ndGggJiYgKHN0YXJ0Tm9kZS5wYXJlbnRzKCdmaWdjYXB0aW9uJykubGVuZ3RoIHx8IGVuZE5vZGUucGFyZW50cygnZmlnY2FwdGlvbicpLmxlbmd0aCkpXG4gICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAvLyBJZiB0aGUgZmlndXJlIGlzIG5vdCB0aGUgc2FtZSwgbXVzdCBibG9ja1xuICAgICAgLy8gQmVjYXVzZSBhIHNlbGVjdGlvbiBjYW4gc3RhcnQgaW4gZmlndXJlWCBhbmQgZW5kIGluIGZpZ3VyZVlcbiAgICAgIGlmICgoc3RhcnROb2RlUGFyZW50LmF0dHIoJ2lkJykgIT0gZW5kTm9kZVBhcmVudC5hdHRyKCdpZCcpKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgIC8vIElmIGN1cnNvciBpcyBhdCBzdGFydCBvZiBjb2RlIHByZXZlbnRcbiAgICAgIGlmIChzdGFydE5vZGUucGFyZW50cyhGSUdVUkVfU0VMRUNUT1IpLmZpbmQoJ3ByZScpLmxlbmd0aCkge1xuXG4gICAgICAgIC8vIElmIGF0IHRoZSBzdGFydCBvZiBwcmU+Y29kZSwgcHJlc3NpbmcgMnRpbWVzIGJhY2tzcGFjZSB3aWxsIHJlbW92ZSBldmVyeXRoaW5nIFxuICAgICAgICBpZiAoc3RhcnROb2RlLnBhcmVudCgpLmlzKCdjb2RlJykgJiYgKHN0YXJ0Tm9kZS5wYXJlbnQoKS5jb250ZW50cygpLmluZGV4KHN0YXJ0Tm9kZSkgPT0gMCAmJiBzZWwuZ2V0Um5nKCkuc3RhcnRPZmZzZXQgPT0gMSkpIHtcbiAgICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydE5vZGUucGFyZW50cyhGSUdVUkVfU0VMRUNUT1IpLnJlbW92ZSgpXG4gICAgICAgICAgfSlcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKHN0YXJ0Tm9kZS5wYXJlbnQoKS5pcygncHJlJykgJiYgc2VsLmdldFJuZygpLnN0YXJ0T2Zmc2V0ID09IDApXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbi8qKlxuICogXG4gKiBAcGFyYW0geyp9IHNlbCBcbiAqL1xuZnVuY3Rpb24gaGFuZGxlRmlndXJlQ2FuYyhzZWwpIHtcblxuICAvLyBHZXQgcmVmZXJlbmNlIG9mIHN0YXJ0IGFuZCBlbmQgbm9kZVxuICBsZXQgc3RhcnROb2RlID0gJChzZWwuZ2V0Um5nKCkuc3RhcnRDb250YWluZXIpXG4gIGxldCBzdGFydE5vZGVQYXJlbnQgPSBzdGFydE5vZGUucGFyZW50cyhGSUdVUkVfU0VMRUNUT1IpXG5cbiAgbGV0IGVuZE5vZGUgPSAkKHNlbC5nZXRSbmcoKS5lbmRDb250YWluZXIpXG4gIGxldCBlbmROb2RlUGFyZW50ID0gZW5kTm9kZS5wYXJlbnRzKEZJR1VSRV9TRUxFQ1RPUilcblxuICAvLyBJZiBhdCBsZWFzdCBzZWxlY3Rpb24gc3RhcnQgb3IgZW5kIGlzIGluc2lkZSB0aGUgZmlndXJlXG4gIGlmIChzdGFydE5vZGVQYXJlbnQubGVuZ3RoIHx8IGVuZE5vZGVQYXJlbnQubGVuZ3RoKSB7XG5cbiAgICAvLyBJZiBzZWxlY3Rpb24gZG9lc24ndCBzdGFydCBhbmQgZW5kIGluIHRoZSBzYW1lIGZpZ3VyZSwgYnV0IG9uZSBiZWV0d2VuIHN0YXJ0IG9yIGVuZCBpcyBpbnNpZGUgdGhlIGZpZ2NhcHRpb24sIG11c3QgYmxvY2tcbiAgICBpZiAoc3RhcnROb2RlLnBhcmVudHMoJ2ZpZ2NhcHRpb24nKS5sZW5ndGggIT0gZW5kTm9kZS5wYXJlbnRzKCdmaWdjYXB0aW9uJykubGVuZ3RoICYmIChzdGFydE5vZGUucGFyZW50cygnZmlnY2FwdGlvbicpLmxlbmd0aCB8fCBlbmROb2RlLnBhcmVudHMoJ2ZpZ2NhcHRpb24nKS5sZW5ndGgpKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyBJZiB0aGUgZmlndXJlIGlzIG5vdCB0aGUgc2FtZSwgbXVzdCBibG9ja1xuICAgIC8vIEJlY2F1c2UgYSBzZWxlY3Rpb24gY2FuIHN0YXJ0IGluIGZpZ3VyZVggYW5kIGVuZCBpbiBmaWd1cmVZXG4gICAgaWYgKChzdGFydE5vZGVQYXJlbnQuYXR0cignaWQnKSAhPSBlbmROb2RlUGFyZW50LmF0dHIoJ2lkJykpKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgfVxuXG4gIC8vIFRoaXMgYWxnb3JpdGhtIGRvZXNuJ3Qgd29yayBpZiBjYXJldCBpcyBpbiBlbXB0eSB0ZXh0IGVsZW1lbnRcblxuICAvLyBDdXJyZW50IGVsZW1lbnQgY2FuIGJlIG9yIHRleHQgb3IgcFxuICBsZXQgcGFyYWdyYXBoID0gc3RhcnROb2RlLmlzKCdwJykgPyBzdGFydE5vZGUgOiBzdGFydE5vZGUucGFyZW50cygncCcpLmZpcnN0KClcbiAgLy8gU2F2ZSBhbGwgY2hsZHJlbiBub2RlcyAodGV4dCBpbmNsdWRlZClcbiAgbGV0IHBhcmFncmFwaENvbnRlbnQgPSBwYXJhZ3JhcGguY29udGVudHMoKVxuXG4gIC8vIElmIG5leHQgdGhlcmUgaXMgYSBmaWd1cmVcbiAgaWYgKHBhcmFncmFwaC5uZXh0KCkuaXMoRklHVVJFX1NFTEVDVE9SKSkge1xuXG4gICAgaWYgKGVuZE5vZGVbMF0ubm9kZVR5cGUgPT0gMykge1xuXG4gICAgICAvLyBJZiB0aGUgZW5kIG5vZGUgaXMgYSB0ZXh0IGluc2lkZSBhIHN0cm9uZywgaXRzIGluZGV4IHdpbGwgYmUgLTEuXG4gICAgICAvLyBJbiB0aGlzIGNhc2UgdGhlIGVkaXRvciBtdXN0IGl0ZXJhdGUgdW50aWwgaXQgZmFjZSBhIGlubGluZSBlbGVtZW50XG4gICAgICBpZiAocGFyYWdyYXBoQ29udGVudC5pbmRleChlbmROb2RlKSA9PSAtMSkgLy8mJiBwYXJhZ3JhcGgucGFyZW50cyhTRUNUSU9OX1NFTEVDVE9SKS5sZW5ndGgpXG4gICAgICAgIGVuZE5vZGUgPSBlbmROb2RlLnBhcmVudCgpXG5cbiAgICAgIC8vIElmIGluZGV4IG9mIHRoZSBpbmxpbmUgZWxlbWVudCBpcyBlcXVhbCBvZiBjaGlsZHJlbiBub2RlIGxlbmd0aFxuICAgICAgLy8gQU5EIHRoZSBjdXJzb3IgaXMgYXQgdGhlIGxhc3QgcG9zaXRpb25cbiAgICAgIC8vIFJlbW92ZSB0aGUgbmV4dCBmaWd1cmUgaW4gb25lIHVuZG8gbGV2ZWxcbiAgICAgIGlmIChwYXJhZ3JhcGhDb250ZW50LmluZGV4KGVuZE5vZGUpICsgMSA9PSBwYXJhZ3JhcGhDb250ZW50Lmxlbmd0aCAmJiBwYXJhZ3JhcGhDb250ZW50Lmxhc3QoKS50ZXh0KCkubGVuZ3RoID09IHNlbC5nZXRSbmcoKS5lbmRPZmZzZXQpIHtcbiAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHBhcmFncmFwaC5uZXh0KCkucmVtb3ZlKClcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSB7Kn0gc2VsID0+IHRpbnltY2Ugc2VsZWN0aW9uXG4gKiBcbiAqIEFkZCBhIHBhcmFncmFwaCBhZnRlciB0aGUgZmlndXJlXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUZpZ3VyZUVudGVyKHNlbCkge1xuXG4gIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHNlbC5nZXROb2RlKCkpXG4gIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJ2ZpZ2NhcHRpb24nKSB8fCAoc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoRklHVVJFX1NFTEVDVE9SKS5sZW5ndGggJiYgc2VsZWN0ZWRFbGVtZW50LmlzKCdwJykpKSB7XG5cbiAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vYWRkIGEgbmV3IHBhcmFncmFwaCBhZnRlciB0aGUgZmlndXJlXG4gICAgICBzZWxlY3RlZEVsZW1lbnQucGFyZW50KEZJR1VSRV9TRUxFQ1RPUikuYWZ0ZXIoJzxwPjxici8+PC9wPicpXG5cbiAgICAgIC8vbW92ZSBjYXJldCBhdCB0aGUgc3RhcnQgb2YgbmV3IHBcbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRDdXJzb3JMb2NhdGlvbihzZWxlY3RlZEVsZW1lbnQucGFyZW50KEZJR1VSRV9TRUxFQ1RPUilbMF0ubmV4dFNpYmxpbmcsIDApXG4gICAgfSlcbiAgICByZXR1cm4gZmFsc2VcbiAgfSBlbHNlIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJ3RoJykpXG4gICAgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogXG4gKiBAcGFyYW0geyp9IHNlbCA9PiB0aW55bWNlIHNlbGVjdGlvblxuICovXG5mdW5jdGlvbiBoYW5kbGVGaWd1cmVDaGFuZ2Uoc2VsKSB7XG5cbiAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG5cbiAgLy8gSWYgcmFzaC1nZW5lcmF0ZWQgc2VjdGlvbiBpcyBkZWxldGUsIHJlLWFkZCBpdFxuICBpZiAoJCgnZmlnY2FwdGlvbjpub3QoOmhhcyhzdHJvbmcpKScpLmxlbmd0aCkge1xuICAgIGNhcHRpb25zKClcbiAgICB1cGRhdGVJZnJhbWVGcm9tU2F2ZWRDb250ZW50KClcbiAgfVxufSIsIi8qKlxuICogcmFqZV9pbmxpbmVfY29kZSBwbHVnaW4gUkFKRVxuICovXG5cbmNvbnN0IERJU0FCTEVfU0VMRUNUT1JfSU5MSU5FID0gJ3RhYmxlLCBpbWcsIHByZSwgY29kZSwgc2VjdGlvbltyb2xlPWRvYy1iaWJsaW9ncmFwaHldJ1xuXG5jb25zdCBJTkxJTkVfRVJST1JTID0gJ0Vycm9yLCBJbmxpbmUgZWxlbWVudHMgY2FuIGJlIE9OTFkgY3JlYXRlZCBpbnNpZGUgdGhlIHNhbWUgcGFyYWdyYXBoJ1xuXG4vKipcbiAqIFxuICovXG5sZXQgaW5saW5lID0ge1xuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGhhbmRsZTogZnVuY3Rpb24gKHR5cGUpIHtcbiAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuXG4gICAgLy8gSWYgdGhlcmUgaXNuJ3QgYW55IGlubGluZSBjb2RlXG4gICAgaWYgKCFzZWxlY3RlZEVsZW1lbnQuaXModHlwZSkgJiYgIXNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKHR5cGUpLmxlbmd0aCkge1xuXG4gICAgICBsZXQgdGV4dCA9IFpFUk9fU1BBQ0VcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHNlbGVjdGlvbiBzdGFydHMgYW5kIGVuZHMgaW4gdGhlIHNhbWUgcGFyYWdyYXBoXG4gICAgICBpZiAoIXRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5pc0NvbGxhcHNlZCgpKSB7XG5cbiAgICAgICAgbGV0IHN0YXJ0Tm9kZSA9IHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRTdGFydCgpXG4gICAgICAgIGxldCBlbmROb2RlID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldEVuZCgpXG5cbiAgICAgICAgLy8gTm90aWZ5IHRoZSBlcnJvciBhbmQgZXhpdFxuICAgICAgICBpZiAoc3RhcnROb2RlICE9IGVuZE5vZGUpIHtcbiAgICAgICAgICBub3RpZnkoSU5MSU5FX0VSUk9SUywgJ2Vycm9yJywgMzAwMClcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhdmUgdGhlIHNlbGVjdGVkIGNvbnRlbnQgYXMgdGV4dFxuICAgICAgICB0ZXh0ICs9IHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRDb250ZW50KClcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IHNlbGVjdGlvbiB3aXRoIGNvZGUgZWxlbWVudFxuICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgc2VsZWN0ZWQgbm9kZVxuICAgICAgICBsZXQgcHJldmlvdXNOb2RlSW5kZXggPSBzZWxlY3RlZEVsZW1lbnQuY29udGVudHMoKS5pbmRleCgkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKS5zdGFydENvbnRhaW5lcikpXG5cbiAgICAgICAgLy8gQWRkIGNvZGUgZWxlbWVudFxuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2V0Q29udGVudChgPCR7dHlwZX0+JHt0ZXh0fTwvJHt0eXBlfT4keyh0eXBlID09ICdxJyA/IFpFUk9fU1BBQ0UgOiAnJyl9YClcbiAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG5cbiAgICAgICAgLy8gTW92ZSBjYXJldCBhdCB0aGUgZW5kIG9mIHRoZSBzdWNjZXNzaXZlIG5vZGUgb2YgcHJldmlvdXMgc2VsZWN0ZWQgbm9kZVxuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2V0Q3Vyc29yTG9jYXRpb24oc2VsZWN0ZWRFbGVtZW50LmNvbnRlbnRzKClbcHJldmlvdXNOb2RlSW5kZXggKyAxXSwgMSlcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGV4aXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBHZXQgdGhlIGN1cnJlbnQgbm9kZSBpbmRleCwgcmVsYXRpdmUgdG8gaXRzIHBhcmVudFxuICAgIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpXG4gICAgbGV0IHBhcmVudENvbnRlbnQgPSBzZWxlY3RlZEVsZW1lbnQucGFyZW50KCkuY29udGVudHMoKVxuICAgIGxldCBpbmRleCA9IHBhcmVudENvbnRlbnQuaW5kZXgoc2VsZWN0ZWRFbGVtZW50KVxuXG4gICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBDaGVjayBpZiB0aGUgY3VycmVudCBub2RlIGhhcyBhIHRleHQgYWZ0ZXJcbiAgICAgIGlmICh0eXBlb2YgcGFyZW50Q29udGVudFtpbmRleCArIDFdICE9ICd1bmRlZmluZWQnICYmICQocGFyZW50Q29udGVudFtpbmRleCArIDFdKS5pcygndGV4dCcpKSB7XG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRDdXJzb3JMb2NhdGlvbihwYXJlbnRDb250ZW50W2luZGV4ICsgMV0sIDApXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5zZXRDb250ZW50KFpFUk9fU1BBQ0UpXG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBub2RlIGhhc24ndCB0ZXh0IGFmdGVyLCByYWplIGhhcyB0byBhZGQgaXRcbiAgICAgIGVsc2Uge1xuICAgICAgICBzZWxlY3RlZEVsZW1lbnQuYWZ0ZXIoWkVST19TUEFDRSlcbiAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldEN1cnNvckxvY2F0aW9uKHBhcmVudENvbnRlbnRbaW5kZXggKyAxXSwgMClcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIHJlcGxhY2VUZXh0OiBmdW5jdGlvbiAoY2hhcikge1xuXG4gICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcbiAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIFNldCB0aGUgbmV3IGNoYXIgYW5kIG92ZXJ3cml0ZSBjdXJyZW50IHRleHRcbiAgICAgIHNlbGVjdGVkRWxlbWVudC5odG1sKGNoYXIpXG5cbiAgICAgIC8vIE1vdmUgdGhlIGNhcmV0IGF0IHRoZSBlbmQgb2YgY3VycmVudCB0ZXh0XG4gICAgICBsZXQgY29udGVudCA9IHNlbGVjdGVkRWxlbWVudC5jb250ZW50cygpXG4gICAgICBtb3ZlQ2FyZXQoY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDFdKVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBcbiAqL1xudGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9pbmxpbmVDb2RlJywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG5cbiAgY29uc3QgQ09ERSA9ICdjb2RlJ1xuXG4gIC8vIEFkZCBhIGJ1dHRvbiB0aGF0IG9wZW5zIGEgd2luZG93XG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfaW5saW5lQ29kZScsIHtcbiAgICB0aXRsZTogJ2lubGluZV9jb2RlJyxcbiAgICBpY29uOiAnaWNvbi1pbmxpbmUtY29kZScsXG4gICAgdG9vbHRpcDogJ0lubGluZSBjb2RlJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IERJU0FCTEVfU0VMRUNUT1JfSU5MSU5FLFxuXG4gICAgLy8gQnV0dG9uIGJlaGF2aW91clxuICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlubGluZS5oYW5kbGUoQ09ERSlcbiAgICB9XG4gIH0pXG5cbiAgZWRpdG9yLm9uKCdrZXlEb3duJywgZnVuY3Rpb24gKGUpIHtcblxuICAgIC8vIENoZWNrIGlmIHRoZSBzZWxlY3RlZCBlbGVtZW50IGlzIGEgQ09ERSB0aGF0IGlzbid0IGluc2lkZSBhIEZJR1VSRSBvciBQUkVcbiAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJ2NvZGUnKSAmJiAhc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoRklHVVJFX1NFTEVDVE9SKS5sZW5ndGggJiYgIXNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKCdwcmUnKS5sZW5ndGgpIHtcblxuICAgICAgLyoqXG4gICAgICAgKiBDaGVjayBpZiBFTlRFUiBpcyBwcmVzc2VkXG4gICAgICAgKi9cbiAgICAgIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICBpbmxpbmUuZXhpdCgpXG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQ2hlY2sgaWYgYSBQUklOVEFCTEUgQ0hBUiBpcyBwcmVzc2VkXG4gICAgICAgKi9cbiAgICAgIGlmIChjaGVja0lmUHJpbnRhYmxlQ2hhcihlLmtleUNvZGUpKSB7XG5cbiAgICAgICAgLy8gSWYgdGhlIGZpcnN0IGNoYXIgaXMgWkVST19TUEFDRSBhbmQgdGhlIGNvZGUgaGFzIG5vIGNoYXJcbiAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkubGVuZ3RoID09IDIgJiYgYCYjJHtzZWxlY3RlZEVsZW1lbnQudGV4dCgpLmNoYXJDb2RlQXQoMCl9O2AgPT0gWkVST19TUEFDRSkge1xuICAgICAgICAgIFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgICBpbmxpbmUucmVwbGFjZVRleHQoZS5rZXkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG59KVxuXG4vKipcbiAqICBJbmxpbmUgcXVvdGUgcGx1Z2luIFJBSkVcbiAqL1xudGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9pbmxpbmVRdW90ZScsIGZ1bmN0aW9uIChlZGl0b3IsIHVybCkge1xuXG4gIGNvbnN0IFEgPSAncSdcblxuICAvLyBBZGQgYSBidXR0b24gdGhhdCBoYW5kbGUgdGhlIGlubGluZSBlbGVtZW50XG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfaW5saW5lUXVvdGUnLCB7XG4gICAgdGl0bGU6ICdpbmxpbmVfcXVvdGUnLFxuICAgIGljb246ICdpY29uLWlubGluZS1xdW90ZScsXG4gICAgdG9vbHRpcDogJ0lubGluZSBxdW90ZScsXG4gICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yOiBESVNBQkxFX1NFTEVDVE9SX0lOTElORSxcblxuICAgIC8vIEJ1dHRvbiBiZWhhdmlvdXJcbiAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpbmxpbmUuaGFuZGxlKCdxJylcbiAgICB9XG4gIH0pXG5cbiAgZWRpdG9yLm9uKCdrZXlEb3duJywgZnVuY3Rpb24gKGUpIHtcblxuICAgIC8vIENoZWNrIGlmIHRoZSBzZWxlY3RlZCBlbGVtZW50IGlzIGEgQ09ERSB0aGF0IGlzbid0IGluc2lkZSBhIEZJR1VSRSBvciBQUkVcbiAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJ3EnKSkge1xuXG4gICAgICAvKipcbiAgICAgICAqIENoZWNrIGlmIEVOVEVSIGlzIHByZXNzZWRcbiAgICAgICAqL1xuICAgICAgaWYgKGUua2V5Q29kZSA9PSAxMykge1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgIGlubGluZS5leGl0KClcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDaGVjayBpZiBhIFBSSU5UQUJMRSBDSEFSIGlzIHByZXNzZWRcbiAgICAgICAqL1xuICAgICAgaWYgKGNoZWNrSWZQcmludGFibGVDaGFyKGUua2V5Q29kZSkpIHtcblxuICAgICAgICAvLyBJZiB0aGUgZmlyc3QgY2hhciBpcyBaRVJPX1NQQUNFIGFuZCB0aGUgY29kZSBoYXMgbm8gY2hhclxuICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LnRleHQoKS5sZW5ndGggPT0gMSAmJiBgJiMke3NlbGVjdGVkRWxlbWVudC50ZXh0KCkuY2hhckNvZGVBdCgwKX07YCA9PSBaRVJPX1NQQUNFKSB7XG5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgICAgaW5saW5lLnJlcGxhY2VUZXh0KGUua2V5KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxufSlcblxuLyoqXG4gKiBcbiAqL1xudGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9leHRlcm5hbExpbmsnLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcblxuICBlZGl0b3IuYWRkQnV0dG9uKCdyYWplX2V4dGVybmFsTGluaycsIHtcbiAgICB0aXRsZTogJ2V4dGVybmFsX2xpbmsnLFxuICAgIGljb246ICdpY29uLWV4dGVybmFsLWxpbmsnLFxuICAgIHRvb2x0aXA6ICdFeHRlcm5hbCBsaW5rJyxcbiAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6IERJU0FCTEVfU0VMRUNUT1JfSU5MSU5FLFxuXG4gICAgLy8gQnV0dG9uIGJlaGF2aW91clxuICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHt9XG4gIH0pXG5cblxuICBsZXQgbGluayA9IHtcbiAgICBhZGQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBcbiAqL1xudGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9pbmxpbmVGaWd1cmUnLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcbiAgZWRpdG9yLmFkZEJ1dHRvbigncmFqZV9pbmxpbmVGaWd1cmUnLCB7XG4gICAgdGV4dDogJ2lubGluZV9maWd1cmUnLFxuICAgIHRvb2x0aXA6ICdJbmxpbmUgcXVvdGUnLFxuICAgIGRpc2FibGVkU3RhdGVTZWxlY3RvcjogRElTQUJMRV9TRUxFQ1RPUl9JTkxJTkUsXG5cbiAgICAvLyBCdXR0b24gYmVoYXZpb3VyXG4gICAgb25jbGljazogZnVuY3Rpb24gKCkge31cbiAgfSlcbn0pIiwidGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9saXN0cycsIGZ1bmN0aW9uIChlZGl0b3IsIHVybCkge1xuXG4gIGNvbnN0IE9MID0gJ29sJ1xuICBjb25zdCBVTCA9ICd1bCdcblxuICBlZGl0b3IuYWRkQnV0dG9uKCdyYWplX29sJywge1xuICAgIHRpdGxlOiAncmFqZV9vbCcsXG4gICAgaWNvbjogJ2ljb24tb2wnLFxuICAgIHRvb2x0aXA6ICdPcmRlcmVkIGxpc3QnLFxuICAgIGRpc2FibGVkU3RhdGVTZWxlY3RvcjogRElTQUJMRV9TRUxFQ1RPUl9GSUdVUkVTLFxuXG4gICAgLy8gQnV0dG9uIGJlaGF2aW91clxuICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxpc3QuYWRkKE9MKVxuICAgIH1cbiAgfSlcblxuICBlZGl0b3IuYWRkQnV0dG9uKCdyYWplX3VsJywge1xuICAgIHRpdGxlOiAncmFqZV91bCcsXG4gICAgaWNvbjogJ2ljb24tdWwnLFxuICAgIHRvb2x0aXA6ICdVbm9yZGVyZWQgbGlzdCcsXG4gICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yOiBESVNBQkxFX1NFTEVDVE9SX0ZJR1VSRVMsXG5cbiAgICAvLyBCdXR0b24gYmVoYXZpb3VyXG4gICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgbGlzdC5hZGQoVUwpXG4gICAgfVxuICB9KVxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGVkaXRvci5vbigna2V5RG93bicsIGZ1bmN0aW9uIChlKSB7XG5cblxuICAgIC8vIENoZWNrIGlmIHRoZSBzZWxlY3RlZCBlbGVtZW50IGlzIGEgUCBpbnNpZGUgYSBsaXN0IChPTCwgVUwpXG4gICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcbiAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKCdwJykgJiYgKHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKCd1bCcpLmxlbmd0aCB8fCBzZWxlY3RlZEVsZW1lbnQucGFyZW50cygnbGknKS5sZW5ndGgpKSB7XG5cblxuICAgICAgLyoqXG4gICAgICAgKiBDaGVjayBpZiBDTUQrRU5URVIgb3IgQ1RSTCtFTlRFUiBhcmUgcHJlc3NlZFxuICAgICAgICovXG4gICAgICBpZiAoKGUubWV0YUtleSB8fCBlLmN0cmxLZXkpICYmIGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgbGlzdC5hZGRQYXJhZ3JhcGgoKVxuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIENoZWNrIGlmIFNISUZUK1RBQiBpcyBwcmVzc2VkXG4gICAgICAgKi9cbiAgICAgIGVsc2UgaWYgKGUuc2hpZnRLZXkgJiYgZS5rZXlDb2RlID09IDkpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIGxpc3QuZGVOZXN0KClcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDaGVjayBpZiBFTlRFUiBpcyBwcmVzc2VkXG4gICAgICAgKi9cbiAgICAgIGVsc2UgaWYgKGUua2V5Q29kZSA9PSAxMykge1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBzZWxlY3Rpb24gaXMgY29sbGFwc2VkXG4gICAgICAgIGlmICh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uaXNDb2xsYXBzZWQoKSkge1xuXG4gICAgICAgICAgaWYgKCFzZWxlY3RlZEVsZW1lbnQudGV4dCgpLnRyaW0oKS5sZW5ndGgpIHtcblxuICAgICAgICAgICAgLy8gRGUgbmVzdFxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKCd1bCxvbCcpLmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgIGxpc3QuZGVOZXN0KClcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBlbXB0eSBMSVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBsaXN0LnJlbW92ZUxpc3RJdGVtKClcblxuICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgbGlzdC5hZGRMaXN0SXRlbSgpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDaGVjayBpZiBUQUIgaXMgcHJlc3NlZFxuICAgICAgICovXG4gICAgICBlbHNlIGlmIChlLmtleUNvZGUgPT0gOSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgbGlzdC5uZXN0KClcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cblxuICAvKipcbiAgICogXG4gICAqL1xuICBsZXQgbGlzdCA9IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24gKHR5cGUpIHtcblxuICAgICAgLy8gR2V0IHRoZSBjdXJyZW50IGVsZW1lbnQgXG4gICAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgICAgbGV0IHRleHQgPSAnPGJyPidcblxuICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgZWxlbWVudCBoYXMgdGV4dCwgc2F2ZSBpdFxuICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCA+IDApXG4gICAgICAgIHRleHQgPSBzZWxlY3RlZEVsZW1lbnQudGV4dCgpLnRyaW0oKVxuXG4gICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgbGV0IG5ld0xpc3QgPSAkKGA8JHt0eXBlfT48bGk+PHA+JHt0ZXh0fTwvcD48L2xpPjwvJHt0eXBlfT5gKVxuXG4gICAgICAgIC8vIEFkZCB0aGUgbmV3IGVsZW1lbnRcbiAgICAgICAgc2VsZWN0ZWRFbGVtZW50LnJlcGxhY2VXaXRoKG5ld0xpc3QpXG5cbiAgICAgICAgLy8gU2F2ZSBjaGFuZ2VzXG4gICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICAgIC8vIE1vdmUgdGhlIGN1cnNvclxuICAgICAgICBtb3ZlQ2FyZXQobmV3TGlzdC5maW5kKCdwJylbMF0sIGZhbHNlKVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgYWRkTGlzdEl0ZW06IGZ1bmN0aW9uICgpIHtcblxuICAgICAgY29uc3QgQlIgPSAnPGJyPidcblxuICAgICAgLy8gR2V0IHRoZSByZWZlcmVuY2VzIG9mIHRoZSBleGlzdGluZyBlbGVtZW50XG4gICAgICBsZXQgcCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcbiAgICAgIGxldCBsaXN0SXRlbSA9IHAucGFyZW50KCdsaScpXG5cbiAgICAgIC8vIFBsYWNlaG9sZGVyIHRleHQgb2YgdGhlIG5ldyBsaVxuICAgICAgbGV0IG5ld1RleHQgPSBCUlxuICAgICAgbGV0IG5vZGVzID0gcC5jb250ZW50cygpXG5cbiAgICAgIC8vIElmIHRoZXJlIGlzIGp1c3Qgb25lIG5vZGUgd3JhcHBlZCBpbnNpZGUgdGhlIHBhcmFncmFwaFxuICAgICAgaWYgKG5vZGVzLmxlbmd0aCA9PSAxKSB7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBzdGFydCBvZmZzZXQgYW5kIHRleHQgb2YgdGhlIGN1cnJlbnQgbGlcbiAgICAgICAgbGV0IHN0YXJ0T2Zmc2V0ID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldFJuZygpLnN0YXJ0T2Zmc2V0XG4gICAgICAgIGxldCBwVGV4dCA9IHAudGV4dCgpXG5cbiAgICAgICAgLy8gSWYgdGhlIGN1cnNvciBpc24ndCBhdCB0aGUgZW5kXG4gICAgICAgIGlmIChzdGFydE9mZnNldCAhPSBwVGV4dC5sZW5ndGgpIHtcblxuICAgICAgICAgIC8vIEdldCB0aGUgcmVtYWluaW5nIHRleHRcbiAgICAgICAgICBuZXdUZXh0ID0gcFRleHQuc3Vic3RyaW5nKHN0YXJ0T2Zmc2V0LCBwVGV4dC5sZW5ndGgpXG4gICAgICAgIH1cblxuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAvLyBVcGRhdGUgdGhlIHRleHQgb2YgdGhlIGN1cnJlbnQgbGlcbiAgICAgICAgICBwLnRleHQocFRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0T2Zmc2V0KSlcblxuICAgICAgICAgIGlmICghcC50ZXh0KCkubGVuZ3RoKVxuICAgICAgICAgICAgcC5odG1sKEJSKVxuXG4gICAgICAgICAgLy8gQ3JlYXRlIGFuZCBhZGQgdGhlIG5ldyBsaVxuICAgICAgICAgIGxldCBuZXdMaXN0SXRlbSA9ICQoYDxsaT48cD4ke25ld1RleHR9PC9wPjwvbGk+YClcbiAgICAgICAgICBsaXN0SXRlbS5hZnRlcihuZXdMaXN0SXRlbSlcblxuICAgICAgICAgIC8vIE1vdmUgdGhlIGNhcmV0IHRvIHRoZSBuZXcgbGlcbiAgICAgICAgICBtb3ZlQ2FyZXQobmV3TGlzdEl0ZW1bMF0sIHRydWUpXG5cbiAgICAgICAgICAvLyBVcGRhdGUgdGhlIGNvbnRlbnRcbiAgICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgLy8gSW5zdGVhZCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgbm9kZXMgaW5zaWRlIHRoZSBwYXJhZ3JhcGhcbiAgICAgIGVsc2Uge1xuXG4gICAgICAgIC8vIElzdGFudGlhdGUgdGhlIHJhbmdlIHRvIGJlIHNlbGVjdGVkXG4gICAgICAgIGxldCByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKClcblxuICAgICAgICAvLyBTdGFydCB0aGUgcmFuZ2UgZnJvbSB0aGUgc2VsZWN0ZWQgbm9kZSBhbmQgb2Zmc2V0IGFuZCBlbmRzIGl0IGF0IHRoZSBlbmQgb2YgdGhlIGxhc3Qgbm9kZVxuICAgICAgICByYW5nZS5zZXRTdGFydCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuc3RhcnRDb250YWluZXIsIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKS5zdGFydE9mZnNldClcbiAgICAgICAgcmFuZ2Uuc2V0RW5kKHRoaXMuZ2V0TGFzdE5vdEVtcHR5Tm9kZShub2RlcyksIDEpXG5cbiAgICAgICAgLy8gU2VsZWN0IHRoZSByYW5nZVxuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2V0Um5nKHJhbmdlKVxuXG4gICAgICAgIC8vIFNhdmUgdGhlIGh0bWwgY29udGVudFxuICAgICAgICBuZXdUZXh0ID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldENvbnRlbnQoKVxuXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIHAuaHRtbChwLmh0bWwoKS5yZXBsYWNlKG5ld1RleHQsICcnKSlcblxuICAgICAgICAgIGlmICghcC50ZXh0KCkubGVuZ3RoKVxuICAgICAgICAgICAgcC5odG1sKEJSKVxuXG4gICAgICAgICAgLy8gQ3JlYXRlIGFuZCBhZGQgdGhlIG5ldyBsaVxuICAgICAgICAgIGxldCBuZXdMaXN0SXRlbSA9ICQoYDxsaT48cD4ke25ld1RleHR9PC9wPjwvbGk+YClcbiAgICAgICAgICBsaXN0SXRlbS5hZnRlcihuZXdMaXN0SXRlbSlcblxuICAgICAgICAgIC8vIE1vdmUgdGhlIGNhcmV0IHRvIHRoZSBuZXcgbGlcbiAgICAgICAgICBtb3ZlQ2FyZXQobmV3TGlzdEl0ZW1bMF0sIHRydWUpXG5cbiAgICAgICAgICAvLyBVcGRhdGUgdGhlIGNvbnRlbnRcbiAgICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgZ2V0TGFzdE5vdEVtcHR5Tm9kZTogZnVuY3Rpb24gKG5vZGVzKSB7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG5vZGVzW2ldLm5vZGVUeXBlID09IDMgJiYgIW5vZGVzW2ldLmxlbmd0aClcbiAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIHJlbW92ZUxpc3RJdGVtOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIEdldCB0aGUgc2VsZWN0ZWQgbGlzdEl0ZW1cbiAgICAgIGxldCBsaXN0SXRlbSA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSkucGFyZW50KCdsaScpXG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBBZGQgYSBlbXB0eSBwYXJhZ3JhcGggYWZ0ZXIgdGhlIGxpc3RcbiAgICAgICAgbGV0IG5ld1AgPSAkKCc8cD48YnI+PC9wPicpXG4gICAgICAgIGxpc3RJdGVtLnBhcmVudCgpLmFmdGVyKG5ld1ApXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGxpc3QgaGFzIGV4YWN0bHkgb25lIGNoaWxkIHJlbW92ZSB0aGUgbGlzdFxuICAgICAgICBpZiAobGlzdEl0ZW0ucGFyZW50KCkuY2hpbGRyZW4oJ2xpJykubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICBsZXQgbGlzdCA9IGxpc3RJdGVtLnBhcmVudCgpXG4gICAgICAgICAgbGlzdC5yZW1vdmUoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGxpc3QgaGFzIG1vcmUgY2hpbGRyZW4gcmVtb3ZlIHRoZSBzZWxlY3RlZCBjaGlsZFxuICAgICAgICBlbHNlXG4gICAgICAgICAgbGlzdEl0ZW0ucmVtb3ZlKClcblxuICAgICAgICBtb3ZlQ2FyZXQobmV3UFswXSlcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGNvbnRlbnRcbiAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBuZXN0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIGxldCBwID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgICAgbGV0IGxpc3RJdGVtID0gcC5wYXJlbnQoJ2xpJylcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIGN1cnJlbnQgbGkgaGFzIGF0IGxlYXN0IG9uZSBwcmV2aW91cyBlbGVtZW50XG4gICAgICBpZiAobGlzdEl0ZW0ucHJldkFsbCgpLmxlbmd0aCA+IDApIHtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIG5ldyBsaXN0XG4gICAgICAgIGxldCB0ZXh0ID0gJzxicj4nXG5cbiAgICAgICAgaWYgKHAudGV4dCgpLnRyaW0oKS5sZW5ndGgpXG4gICAgICAgICAgdGV4dCA9IHAudGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIC8vIEdldCB0eXBlIG9mIHRoZSBwYXJlbnQgbGlzdFxuICAgICAgICBsZXQgdHlwZSA9IGxpc3RJdGVtLnBhcmVudCgpWzBdLnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgbmV3IG5lc3RlZCBsaXN0XG4gICAgICAgIGxldCBuZXdMaXN0SXRlbSA9ICQobGlzdEl0ZW1bMF0ub3V0ZXJIVE1MKVxuXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIC8vIElmIHRoZSBwcmV2aW91cyBlbGVtZW50IGhhcyBhIGxpc3RcbiAgICAgICAgICBpZiAobGlzdEl0ZW0ucHJldigpLmZpbmQoJ3VsLG9sJykubGVuZ3RoKVxuICAgICAgICAgICAgbGlzdEl0ZW0ucHJldigpLmZpbmQoJ3VsLG9sJykuYXBwZW5kKG5ld0xpc3RJdGVtKVxuXG4gICAgICAgICAgLy8gQWRkIHRoZSBuZXcgbGlzdCBpbnNpZGUgdGhlIHByZXZpb3VzIGxpXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXdMaXN0SXRlbSA9ICQoYDwke3R5cGV9PiR7bmV3TGlzdEl0ZW1bMF0ub3V0ZXJIVE1MfTwvJHt0eXBlfT5gKVxuICAgICAgICAgICAgbGlzdEl0ZW0ucHJldigpLmFwcGVuZChuZXdMaXN0SXRlbSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0SXRlbS5yZW1vdmUoKVxuXG4gICAgICAgICAgLy8gTW92ZSB0aGUgY2FyZXQgYXQgdGhlIGVuZCBvZiB0aGUgbmV3IHAgXG4gICAgICAgICAgbW92ZUNhcmV0KG5ld0xpc3RJdGVtLmZpbmQoJ3AnKVswXSlcblxuICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBkZU5lc3Q6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgbGV0IGxpc3RJdGVtID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKS5wYXJlbnQoJ2xpJylcbiAgICAgIGxldCBsaXN0ID0gbGlzdEl0ZW0ucGFyZW50KClcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIGN1cnJlbnQgbGlzdCBoYXMgYXQgbGVhc3QgYW5vdGhlciBsaXN0IGFzIHBhcmVudFxuICAgICAgaWYgKGxpc3RJdGVtLnBhcmVudHMoJ3VsLG9sJykubGVuZ3RoID4gMSkge1xuXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIC8vIEdldCBhbGwgbGk6IGN1cnJlbnQgYW5kIGlmIHRoZXJlIGFyZSBzdWNjZXNzaXZlXG4gICAgICAgICAgbGV0IG5leHRMaSA9IFtsaXN0SXRlbV1cbiAgICAgICAgICBpZiAobGlzdEl0ZW0ubmV4dEFsbCgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxpc3RJdGVtLm5leHRBbGwoKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgbmV4dExpLnB1c2goJCh0aGlzKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTW92ZSBhbGwgbGkgb3V0IGZyb20gdGhlIG5lc3RlZCBsaXN0XG4gICAgICAgICAgZm9yIChsZXQgaSA9IG5leHRMaS5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgICAgICAgbmV4dExpW2ldLnJlbW92ZSgpXG4gICAgICAgICAgICBsaXN0LnBhcmVudCgpLmFmdGVyKG5leHRMaVtpXSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZiBlbXB0eSByZW1vdmUgdGhlIGxpc3RcbiAgICAgICAgICBpZiAoIWxpc3QuY2hpbGRyZW4oJ2xpJykubGVuZ3RoKVxuICAgICAgICAgICAgbGlzdC5yZW1vdmUoKVxuXG4gICAgICAgICAgLy8gTW92ZSB0aGUgY2FyZXQgYXQgdGhlIGVuZFxuICAgICAgICAgIG1vdmVDYXJldChsaXN0SXRlbS5maW5kKCdwJylbMF0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGFkZFBhcmFncmFwaDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBHZXQgcmVmZXJlbmNlcyBvZiBjdXJyZW50IHBcbiAgICAgIGxldCBwID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuICAgICAgbGV0IHN0YXJ0T2Zmc2V0ID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldFJuZygpLnN0YXJ0T2Zmc2V0XG4gICAgICBsZXQgcFRleHQgPSBwLnRleHQoKS50cmltKClcblxuICAgICAgbGV0IHRleHQgPSAnPGJyPidcblxuICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8vIElmIHRoZSBFTlRFUiBicmVha3MgcFxuICAgICAgICBpZiAoc3RhcnRPZmZzZXQgIT0gcFRleHQubGVuZ3RoKSB7XG5cbiAgICAgICAgICAvLyBVcGRhdGUgdGhlIHRleHQgb2YgdGhlIGN1cnJlbnQgbGlcbiAgICAgICAgICBwLnRleHQocFRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0T2Zmc2V0KSlcblxuICAgICAgICAgIC8vIEdldCB0aGUgcmVtYWluaW5nIHRleHRcbiAgICAgICAgICB0ZXh0ID0gcFRleHQuc3Vic3RyaW5nKHN0YXJ0T2Zmc2V0LCBwVGV4dC5sZW5ndGgpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgYW5kIGFkZCB0aGUgZWxlbWVudFxuICAgICAgICBsZXQgbmV3UCA9ICQoYDxwPiR7dGV4dH08L3A+YClcbiAgICAgICAgcC5hZnRlcihuZXdQKVxuXG4gICAgICAgIG1vdmVDYXJldChuZXdQWzBdLCB0cnVlKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn0pIiwiLyoqXG4gKiBcbiAqL1xuXG5mdW5jdGlvbiBvcGVuTWV0YWRhdGFEaWFsb2coKSB7XG4gIHRpbnltY2UuYWN0aXZlRWRpdG9yLndpbmRvd01hbmFnZXIub3Blbih7XG4gICAgdGl0bGU6ICdFZGl0IG1ldGFkYXRhJyxcbiAgICB1cmw6ICdqcy9yYWplLWNvcmUvcGx1Z2luL3JhamVfbWV0YWRhdGEuaHRtbCcsXG4gICAgd2lkdGg6IDk1MCxcbiAgICBoZWlnaHQ6IDgwMCxcbiAgICBvbkNsb3NlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIGlmICh0aW55bWNlLmFjdGl2ZUVkaXRvci51cGRhdGVkX21ldGFkYXRhICE9IG51bGwpIHtcblxuICAgICAgICBtZXRhZGF0YS51cGRhdGUodGlueW1jZS5hY3RpdmVFZGl0b3IudXBkYXRlZF9tZXRhZGF0YSlcblxuICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51cGRhdGVkX21ldGFkYXRhID09IG51bGxcbiAgICAgIH1cblxuICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iud2luZG93TWFuYWdlci5jbG9zZSgpXG4gICAgfVxuICB9LCBtZXRhZGF0YS5nZXRBbGxNZXRhZGF0YSgpKVxufVxuXG50aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdyYWplX21ldGFkYXRhJywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG5cbiAgLy8gQWRkIGEgYnV0dG9uIHRoYXQgaGFuZGxlIHRoZSBpbmxpbmUgZWxlbWVudFxuICBlZGl0b3IuYWRkQnV0dG9uKCdyYWplX21ldGFkYXRhJywge1xuICAgIHRleHQ6ICdNZXRhZGF0YScsXG4gICAgaWNvbjogZmFsc2UsXG4gICAgdG9vbHRpcDogJ0VkaXQgbWV0YWRhdGEnLFxuXG4gICAgLy8gQnV0dG9uIGJlaGF2aW91clxuICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgIG9wZW5NZXRhZGF0YURpYWxvZygpXG4gICAgfVxuICB9KVxuXG4gIGVkaXRvci5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmICgkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpLmlzKEhFQURFUl9TRUxFQ1RPUikpXG4gICAgICBvcGVuTWV0YWRhdGFEaWFsb2coKVxuICB9KVxuXG4gIG1ldGFkYXRhID0ge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgZ2V0QWxsTWV0YWRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBoZWFkZXIgPSAkKEhFQURFUl9TRUxFQ1RPUilcbiAgICAgIGxldCBzdWJ0aXRsZSA9IGhlYWRlci5maW5kKCdoMS50aXRsZSA+IHNtYWxsJykudGV4dCgpXG4gICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgc3VidGl0bGU6IHN1YnRpdGxlLFxuICAgICAgICB0aXRsZTogaGVhZGVyLmZpbmQoJ2gxLnRpdGxlJykudGV4dCgpLnJlcGxhY2Uoc3VidGl0bGUsICcnKSxcbiAgICAgICAgYXV0aG9yczogbWV0YWRhdGEuZ2V0QXV0aG9ycyhoZWFkZXIpLFxuICAgICAgICBjYXRlZ29yaWVzOiBtZXRhZGF0YS5nZXRDYXRlZ29yaWVzKGhlYWRlciksXG4gICAgICAgIGtleXdvcmRzOiBtZXRhZGF0YS5nZXRLZXl3b3JkcyhoZWFkZXIpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkYXRhXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGdldEF1dGhvcnM6IGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgICAgIGxldCBhdXRob3JzID0gW11cblxuICAgICAgaGVhZGVyLmZpbmQoJ2FkZHJlc3MubGVhZC5hdXRob3JzJykuZWFjaChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLy8gR2V0IGFsbCBhZmZpbGlhdGlvbnNcbiAgICAgICAgbGV0IGFmZmlsaWF0aW9ucyA9IFtdXG4gICAgICAgICQodGhpcykuZmluZCgnc3BhbicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGFmZmlsaWF0aW9ucy5wdXNoKCQodGhpcykudGV4dCgpKVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIHB1c2ggc2luZ2xlIGF1dGhvclxuICAgICAgICBhdXRob3JzLnB1c2goe1xuICAgICAgICAgIG5hbWU6ICQodGhpcykuY2hpbGRyZW4oJ3N0cm9uZy5hdXRob3JfbmFtZScpLnRleHQoKSxcbiAgICAgICAgICBlbWFpbDogJCh0aGlzKS5maW5kKCdjb2RlLmVtYWlsID4gYScpLnRleHQoKSxcbiAgICAgICAgICBhZmZpbGlhdGlvbnM6IGFmZmlsaWF0aW9uc1xuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIGF1dGhvcnNcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgZ2V0Q2F0ZWdvcmllczogZnVuY3Rpb24gKGhlYWRlcikge1xuICAgICAgbGV0IGNhdGVnb3JpZXMgPSBbXVxuXG4gICAgICBoZWFkZXIuZmluZCgncC5hY21fc3ViamVjdF9jYXRlZ29yaWVzID4gY29kZScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBjYXRlZ29yaWVzLnB1c2goJCh0aGlzKS50ZXh0KCkpXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gY2F0ZWdvcmllc1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBnZXRLZXl3b3JkczogZnVuY3Rpb24gKGhlYWRlcikge1xuICAgICAgbGV0IGtleXdvcmRzID0gW11cblxuICAgICAgaGVhZGVyLmZpbmQoJ3VsLmxpc3QtaW5saW5lID4gbGkgPiBjb2RlJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGtleXdvcmRzLnB1c2goJCh0aGlzKS50ZXh0KCkpXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4ga2V5d29yZHNcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodXBkYXRlZE1ldGFkYXRhKSB7XG5cbiAgICAgICQoJ2hlYWQgbWV0YVtwcm9wZXJ0eV0sIGhlYWQgbGlua1twcm9wZXJ0eV0sIGhlYWQgbWV0YVtuYW1lXScpLnJlbW92ZSgpXG5cbiAgICAgIGxldCBjdXJyZW50TWV0YWRhdGEgPSBtZXRhZGF0YS5nZXRBbGxNZXRhZGF0YSgpXG5cbiAgICAgIC8vIFVwZGF0ZSB0aXRsZSBhbmQgc3VidGl0bGVcbiAgICAgIGlmICh1cGRhdGVkTWV0YWRhdGEudGl0bGUgIT0gY3VycmVudE1ldGFkYXRhLnRpdGxlIHx8IHVwZGF0ZWRNZXRhZGF0YS5zdWJ0aXRsZSAhPSBjdXJyZW50TWV0YWRhdGEuc3VidGl0bGUpIHtcbiAgICAgICAgbGV0IHRleHQgPSB1cGRhdGVkTWV0YWRhdGEudGl0bGVcblxuICAgICAgICBpZiAodXBkYXRlZE1ldGFkYXRhLnN1YnRpdGxlLnRyaW0oKS5sZW5ndGgpXG4gICAgICAgICAgdGV4dCArPSBgIC0tICR7dXBkYXRlZE1ldGFkYXRhLnN1YnRpdGxlfWBcblxuICAgICAgICAkKCd0aXRsZScpLnRleHQodGV4dClcbiAgICAgIH1cblxuICAgICAgbGV0IGFmZmlsaWF0aW9uc0NhY2hlID0gW11cblxuICAgICAgdXBkYXRlZE1ldGFkYXRhLmF1dGhvcnMuZm9yRWFjaChmdW5jdGlvbiAoYXV0aG9yKSB7XG5cbiAgICAgICAgJCgnaGVhZCcpLmFwcGVuZChgPG1ldGEgYWJvdXQ9XCJtYWlsdG86JHthdXRob3IuZW1haWx9XCIgdHlwZW9mPVwic2NoZW1hOlBlcnNvblwiIHByb3BlcnR5PVwic2NoZW1hOm5hbWVcIiBuYW1lPVwiZGMuY3JlYXRvclwiIGNvbnRlbnQ9XCIke2F1dGhvci5uYW1lfVwiPmApXG4gICAgICAgICQoJ2hlYWQnKS5hcHBlbmQoYDxtZXRhIGFib3V0PVwibWFpbHRvOiR7YXV0aG9yLmVtYWlsfVwiIHByb3BlcnR5PVwic2NoZW1hOmVtYWlsXCIgY29udGVudD1cIiR7YXV0aG9yLmVtYWlsfVwiPmApXG5cbiAgICAgICAgYXV0aG9yLmFmZmlsaWF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChhZmZpbGlhdGlvbikge1xuXG4gICAgICAgICAgLy8gTG9vayB1cCBmb3IgYWxyZWFkeSBleGlzdGluZyBhZmZpbGlhdGlvblxuICAgICAgICAgIGxldCB0b0FkZCA9IHRydWVcbiAgICAgICAgICBsZXQgaWRcblxuICAgICAgICAgIGFmZmlsaWF0aW9uc0NhY2hlLmZvckVhY2goZnVuY3Rpb24gKGFmZmlsaWF0aW9uQ2FjaGUpIHtcbiAgICAgICAgICAgIGlmIChhZmZpbGlhdGlvbkNhY2hlLmNvbnRlbnQgPT0gYWZmaWxpYXRpb24pIHtcbiAgICAgICAgICAgICAgdG9BZGQgPSBmYWxzZVxuICAgICAgICAgICAgICBpZCA9IGFmZmlsaWF0aW9uQ2FjaGUuaWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gZXhpc3RpbmcgYWZmaWxpYXRpb24sIGFkZCBpdFxuICAgICAgICAgIGlmICh0b0FkZCkge1xuICAgICAgICAgICAgbGV0IGdlbmVyYXRlZElkID0gYCNhZmZpbGlhdGlvbl8ke2FmZmlsaWF0aW9uc0NhY2hlLmxlbmd0aCsxfWBcbiAgICAgICAgICAgIGFmZmlsaWF0aW9uc0NhY2hlLnB1c2goe1xuICAgICAgICAgICAgICBpZDogZ2VuZXJhdGVkSWQsXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IGFmZmlsaWF0aW9uXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgaWQgPSBnZW5lcmF0ZWRJZFxuICAgICAgICAgIH1cblxuICAgICAgICAgICQoJ2hlYWQnKS5hcHBlbmQoYDxsaW5rIGFib3V0PVwibWFpbHRvOiR7YXV0aG9yLmVtYWlsfVwiIHByb3BlcnR5PVwic2NoZW1hOmFmZmlsaWF0aW9uXCIgaHJlZj1cIiR7aWR9XCI+YClcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIGFmZmlsaWF0aW9uc0NhY2hlLmZvckVhY2goZnVuY3Rpb24gKGFmZmlsaWF0aW9uQ2FjaGUpIHtcbiAgICAgICAgJCgnaGVhZCcpLmFwcGVuZChgPG1ldGEgYWJvdXQ9XCIke2FmZmlsaWF0aW9uQ2FjaGUuaWR9XCIgdHlwZW9mPVwic2NoZW1hOk9yZ2FuaXphdGlvblwiIHByb3BlcnR5PVwic2NoZW1hOm5hbWVcIiBjb250ZW50PVwiJHthZmZpbGlhdGlvbkNhY2hlLmNvbnRlbnR9XCI+YClcbiAgICAgIH0pXG5cbiAgICAgIHVwZGF0ZWRNZXRhZGF0YS5jYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24oY2F0ZWdvcnkpe1xuICAgICAgICAkKCdoZWFkJykuYXBwZW5kKGA8bWV0YSBuYW1lPVwiZGN0ZXJtcy5zdWJqZWN0XCIgY29udGVudD1cIiR7Y2F0ZWdvcnl9XCIvPmApXG4gICAgICB9KVxuXG4gICAgICB1cGRhdGVkTWV0YWRhdGEua2V5d29yZHMuZm9yRWFjaChmdW5jdGlvbihrZXl3b3JkKXtcbiAgICAgICAgJCgnaGVhZCcpLmFwcGVuZChgPG1ldGEgcHJvcGVydHk9XCJwcmlzbTprZXl3b3JkXCIgY29udGVudD1cIiR7a2V5d29yZH1cIi8+YClcbiAgICAgIH0pXG5cbiAgICAgICQoJyNyYWplX3Jvb3QnKS5hZGRIZWFkZXJIVE1MKClcbiAgICAgIHNldE5vbkVkaXRhYmxlSGVhZGVyKClcbiAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgIH1cbiAgfVxuXG59KSIsInRpbnltY2UuUGx1Z2luTWFuYWdlci5hZGQoJ3JhamVfc2F2ZScsIGZ1bmN0aW9uIChlZGl0b3IsIHVybCkge1xuXG4gIHNhdmVNYW5hZ2VyID0ge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgaW5pdFNhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFJldHVybiB0aGUgbWVzc2FnZSBmb3IgdGhlIGJhY2tlbmRcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlOiBzYXZlTWFuYWdlci5nZXRUaXRsZSgpLFxuICAgICAgICBkb2N1bWVudDogc2F2ZU1hbmFnZXIuZ2V0RGVyYXNoZWRBcnRpY2xlKClcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgc2F2ZUFzOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIFNlbmQgbWVzc2FnZSB0byB0aGUgYmFja2VuZFxuICAgICAgc2F2ZUFzQXJ0aWNsZShzYXZlTWFuYWdlci5pbml0U2F2ZSgpKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBzYXZlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIFNlbmQgbWVzc2FnZSB0byB0aGUgYmFja2VuZFxuICAgICAgc2F2ZUFydGljbGUoc2F2ZU1hbmFnZXIuaW5pdFNhdmUoKSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBSQVNIIGFydGljbGUgcmVuZGVyZWQgKHdpdGhvdXQgdGlueW1jZSlcbiAgICAgKi9cbiAgICBnZXREZXJhc2hlZEFydGljbGU6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gU2F2ZSBodG1sIHJlZmVyZW5jZXNcbiAgICAgIGxldCBhcnRpY2xlID0gJCgnaHRtbCcpLmNsb25lKClcbiAgICAgIGxldCB0aW55bWNlU2F2ZWRDb250ZW50ID0gYXJ0aWNsZS5maW5kKCcjcmFqZV9yb290JylcblxuICAgICAgYXJ0aWNsZS5yZW1vdmVBdHRyKCdjbGFzcycpXG5cbiAgICAgIC8vcmVwbGFjZSBib2R5IHdpdGggdGhlIHJpZ2h0IG9uZSAodGhpcyBhY3Rpb24gcmVtb3ZlIHRpbnltY2UpXG4gICAgICBhcnRpY2xlLmZpbmQoJ2JvZHknKS5odG1sKHRpbnltY2VTYXZlZENvbnRlbnQuaHRtbCgpKVxuICAgICAgYXJ0aWNsZS5maW5kKCdib2R5JykucmVtb3ZlQXR0cignc3R5bGUnKVxuICAgICAgYXJ0aWNsZS5maW5kKCdib2R5JykucmVtb3ZlQXR0cignY2xhc3MnKVxuXG4gICAgICAvL3JlbW92ZSBhbGwgc3R5bGUgYW5kIGxpbmsgdW4tbmVlZGVkIGZyb20gdGhlIGhlYWRcbiAgICAgIGFydGljbGUuZmluZCgnaGVhZCcpLmNoaWxkcmVuKCdzdHlsZVt0eXBlPVwidGV4dC9jc3NcIl0nKS5yZW1vdmUoKVxuICAgICAgYXJ0aWNsZS5maW5kKCdoZWFkJykuY2hpbGRyZW4oJ2xpbmtbaWRdJykucmVtb3ZlKClcblxuICAgICAgLy8gRXhlY3V0ZSBkZXJhc2ggKHJlcGxhY2UgYWxsIGNnZW4gZWxlbWVudHMgd2l0aCBpdHMgb3JpZ2luYWwgY29udGVudClcbiAgICAgIGFydGljbGUuZmluZCgnKltkYXRhLXJhc2gtb3JpZ2luYWwtY29udGVudF0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IG9yaWdpbmFsQ29udGVudCA9ICQodGhpcykuYXR0cignZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQnKVxuICAgICAgICAkKHRoaXMpLnJlcGxhY2VXaXRoKG9yaWdpbmFsQ29udGVudClcbiAgICAgIH0pXG5cbiAgICAgIC8vIEV4ZWN1dGUgZGVyYXNoIGNoYW5naW5nIHRoZSB3cmFwcGVyXG4gICAgICBhcnRpY2xlLmZpbmQoJypbZGF0YS1yYXNoLW9yaWdpbmFsLXdyYXBwZXJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBjb250ZW50ID0gJCh0aGlzKS5odG1sKClcbiAgICAgICAgbGV0IHdyYXBwZXIgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtcmFzaC1vcmlnaW5hbC13cmFwcGVyJylcbiAgICAgICAgJCh0aGlzKS5yZXBsYWNlV2l0aChgPCR7d3JhcHBlcn0+JHtjb250ZW50fTwvJHt3cmFwcGVyfT5gKVxuICAgICAgfSlcblxuICAgICAgLy8gUmVtb3ZlIHRhcmdldCBmcm9tIFRpbnlNQ0UgbGlua1xuICAgICAgYXJ0aWNsZS5maW5kKCdhW3RhcmdldF0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKCd0YXJnZXQnKVxuICAgICAgfSlcblxuICAgICAgLy8gUmVtb3ZlIGNvbnRlbnRlZGl0YWJsZSBmcm9tIFRpbnlNQ0UgbGlua1xuICAgICAgYXJ0aWNsZS5maW5kKCdhW2NvbnRlbnRlZGl0YWJsZV0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKCdjb250ZW50ZWRpdGFibGUnKVxuICAgICAgfSlcblxuICAgICAgLy8gUmVtb3ZlIG5vdCBhbGxvd2VkIHNwYW4gZWxtZW50cyBpbnNpZGUgdGhlIGZvcm11bGFcbiAgICAgIGFydGljbGUuZmluZChGSUdVUkVfRk9STVVMQV9TRUxFQ1RPUikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oJ3AnKS5odG1sKCQodGhpcykuZmluZCgnc3Bhbltjb250ZW50ZWRpdGFibGVdJykuaHRtbCgpKVxuICAgICAgfSlcblxuICAgICAgYXJ0aWNsZS5maW5kKGAke0ZJR1VSRV9GT1JNVUxBX1NFTEVDVE9SfSwke0lOTElORV9GT1JNVUxBX1NFTEVDVE9SfWApLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJCh0aGlzKS5maW5kKCdzdmdbZGF0YS1tYXRobWxdJykubGVuZ3RoKSB7XG4gICAgICAgICAgJCh0aGlzKS5jaGlsZHJlbigncCcpLmh0bWwoJCh0aGlzKS5maW5kKCdzdmdbZGF0YS1tYXRobWxdJykuYXR0cignZGF0YS1tYXRobWwnKSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoYXJ0aWNsZVswXSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSB0aXRsZSBcbiAgICAgKi9cbiAgICBnZXRUaXRsZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICQoJ3RpdGxlJykudGV4dCgpXG4gICAgfSxcblxuICB9XG59KSIsIi8qKlxuICogUkFTSCBzZWN0aW9uIHBsdWdpbiBSQUpFXG4gKi9cblxuY29uc3QgTk9OX0VESVRBQkxFX0hFQURFUl9TRUxFQ1RPUiA9ICdoZWFkZXIucGFnZS1oZWFkZXIuY29udGFpbmVyLmNnZW4nXG5jb25zdCBCSUJMSU9FTlRSWV9TVUZGSVggPSAnYmlibGlvZW50cnlfJ1xuY29uc3QgRU5ETk9URV9TVUZGSVggPSAnZW5kbm90ZV8nXG5cbmNvbnN0IEJJQkxJT0dSQVBIWV9TRUxFQ1RPUiA9ICdzZWN0aW9uW3JvbGU9ZG9jLWJpYmxpb2dyYXBoeV0nXG5jb25zdCBCSUJMSU9FTlRSWV9TRUxFQ1RPUiA9ICdsaVtyb2xlPWRvYy1iaWJsaW9lbnRyeV0nXG5cbmNvbnN0IEVORE5PVEVTX1NFTEVDVE9SID0gJ3NlY3Rpb25bcm9sZT1kb2MtZW5kbm90ZXNdJ1xuY29uc3QgRU5ETk9URV9TRUxFQ1RPUiA9ICdzZWN0aW9uW3JvbGU9ZG9jLWVuZG5vdGVdJ1xuXG5jb25zdCBBQlNUUkFDVF9TRUxFQ1RPUiA9ICdzZWN0aW9uW3JvbGU9ZG9jLWFic3RyYWN0XSdcbmNvbnN0IEFDS05PV0xFREdFTUVOVFNfU0VMRUNUT1IgPSAnc2VjdGlvbltyb2xlPWRvYy1hY2tub3dsZWRnZW1lbnRzXSdcblxuY29uc3QgTUFJTl9TRUNUSU9OX1NFTEVDVE9SID0gJ2RpdiNyYWplX3Jvb3QgPiBzZWN0aW9uOm5vdChbcm9sZV0pJ1xuY29uc3QgU0VDVElPTl9TRUxFQ1RPUiA9ICdzZWN0aW9uOm5vdChbcm9sZV0pJ1xuY29uc3QgU1BFQ0lBTF9TRUNUSU9OX1NFTEVDVE9SID0gJ3NlY3Rpb25bcm9sZV0nXG5cbmNvbnN0IE1FTlVfU0VMRUNUT1IgPSAnZGl2W2lkXj1tY2V1X11baWQkPS1ib2R5XVtyb2xlPW1lbnVdJ1xuXG5jb25zdCBEQVRBX1VQR1JBREUgPSAnZGF0YS11cGdyYWRlJ1xuY29uc3QgREFUQV9ET1dOR1JBREUgPSAnZGF0YS1kb3duZ3JhZGUnXG5cbmNvbnN0IEhFQURJTkcgPSAnSGVhZGluZydcblxuY29uc3QgSEVBRElOR19UUkFTRk9STUFUSU9OX0ZPUkJJRERFTiA9ICdFcnJvciwgeW91IGNhbm5vdCB0cmFuc2Zvcm0gdGhlIGN1cnJlbnQgaGVhZGVyIGluIHRoaXMgd2F5ISdcblxudGlueW1jZS5QbHVnaW5NYW5hZ2VyLmFkZCgncmFqZV9zZWN0aW9uJywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG5cbiAgbGV0IHJhamVfc2VjdGlvbl9mbGFnID0gZmFsc2VcbiAgbGV0IHJhamVfc3RvcmVkX3NlbGVjdGlvblxuXG4gIGVkaXRvci5hZGRCdXR0b24oJ3JhamVfc2VjdGlvbicsIHtcbiAgICB0eXBlOiAnbWVudWJ1dHRvbicsXG4gICAgdGV4dDogJ0hlYWRpbmdzJyxcbiAgICB0aXRsZTogJ2hlYWRpbmcnLFxuICAgIGljb25zOiBmYWxzZSxcblxuICAgIC8vIFNlY3Rpb25zIHN1YiBtZW51XG4gICAgbWVudTogW3tcbiAgICAgIHRleHQ6IGAke0hFQURJTkd9IDEuYCxcbiAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHNlY3Rpb24uYWRkT3JEb3duVXBncmFkZShlLCAxKVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIHRleHQ6IGAke0hFQURJTkd9IDEuMS5gLFxuICAgICAgb25jbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgc2VjdGlvbi5hZGRPckRvd25VcGdyYWRlKGUsIDIpXG4gICAgICB9XG4gICAgfSwge1xuICAgICAgdGV4dDogYCR7SEVBRElOR30gMS4xLjEuYCxcbiAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHNlY3Rpb24uYWRkT3JEb3duVXBncmFkZShlLCAzKVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIHRleHQ6IGAke0hFQURJTkd9IDEuMS4xLjEuYCxcbiAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHNlY3Rpb24uYWRkT3JEb3duVXBncmFkZShlLCA0KVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIHRleHQ6IGAke0hFQURJTkd9IDEuMS4xLjEuMS5gLFxuICAgICAgb25jbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgc2VjdGlvbi5hZGRPckRvd25VcGdyYWRlKGUsIDUpXG4gICAgICB9XG4gICAgfSwge1xuICAgICAgdGV4dDogYCR7SEVBRElOR30gMS4xLjEuMS4xLjEuYCxcbiAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHNlY3Rpb24uYWRkT3JEb3duVXBncmFkZShlLCA2KVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICdTcGVjaWFsJyxcbiAgICAgIG1lbnU6IFt7XG4gICAgICAgICAgdGV4dDogJ0Fic3RyYWN0JyxcbiAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHNlY3Rpb24uYWRkQWJzdHJhY3QoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRleHQ6ICdBY2tub3dsZWRnZW1lbnRzJyxcbiAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWN0aW9uLmFkZEFja25vd2xlZGdlbWVudHMoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRleHQ6ICdSZWZlcmVuY2VzJyxcbiAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICAgICAgICAvLyBPbmx5IGlmIGJpYmxpb2dyYXBoeSBzZWN0aW9uIGRvZXNuJ3QgZXhpc3RzXG4gICAgICAgICAgICBpZiAoISQoQklCTElPR1JBUEhZX1NFTEVDVE9SKS5sZW5ndGgpIHtcblxuICAgICAgICAgICAgICAvLyBUT0RPIGNoYW5nZSBoZXJlXG4gICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBBZGQgbmV3IGJpYmxpb2VudHJ5XG4gICAgICAgICAgICAgICAgc2VjdGlvbi5hZGRCaWJsaW9lbnRyeSgpXG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgaWZyYW1lXG4gICAgICAgICAgICAgICAgdXBkYXRlSWZyYW1lRnJvbVNhdmVkQ29udGVudCgpXG5cbiAgICAgICAgICAgICAgICAvL21vdmUgY2FyZXQgYW5kIHNldCBmb2N1cyB0byBhY3RpdmUgYWRpdG9yICMxMDVcbiAgICAgICAgICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2VsZWN0KHRpbnltY2UuYWN0aXZlRWRpdG9yLmRvbS5zZWxlY3QoYCR7QklCTElPRU5UUllfU0VMRUNUT1J9Omxhc3QtY2hpbGRgKVswXSwgdHJ1ZSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uc2VsZWN0KHRpbnltY2UuYWN0aXZlRWRpdG9yLmRvbS5zZWxlY3QoYCR7QklCTElPR1JBUEhZX1NFTEVDVE9SfT5oMWApWzBdKVxuXG4gICAgICAgICAgICBzY3JvbGxUbyhgJHtCSUJMSU9FTlRSWV9TRUxFQ1RPUn06bGFzdC1jaGlsZGApXG5cbiAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmZvY3VzKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XVxuICB9KVxuXG4gIGVkaXRvci5vbigna2V5RG93bicsIGZ1bmN0aW9uIChlKSB7XG5cbiAgICAvLyBpbnN0YW5jZSBvZiB0aGUgc2VsZWN0ZWQgZWxlbWVudFxuICAgIGxldCBzZWxlY3RlZEVsZW1lbnQgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpXG5cbiAgICB0cnkge1xuXG4gICAgICBsZXQga2V5Y29kZSA9IGUua2V5Q29kZVxuXG4gICAgICAvLyBTYXZlIGJvdW5kcyBvZiBjdXJyZW50IHNlbGVjdGlvbiAoc3RhcnQgYW5kIGVuZClcbiAgICAgIGxldCBzdGFydE5vZGUgPSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKS5zdGFydENvbnRhaW5lcilcbiAgICAgIGxldCBlbmROb2RlID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuZW5kQ29udGFpbmVyKVxuXG4gICAgICBjb25zdCBTUEVDSUFMX0NIQVJTID1cbiAgICAgICAgKGtleWNvZGUgPiA0NyAmJiBrZXljb2RlIDwgNTgpIHx8IC8vIG51bWJlciBrZXlzXG4gICAgICAgIChrZXljb2RlID4gOTUgJiYga2V5Y29kZSA8IDExMikgfHwgLy8gbnVtcGFkIGtleXNcbiAgICAgICAgKGtleWNvZGUgPiAxODUgJiYga2V5Y29kZSA8IDE5MykgfHwgLy8gOz0sLS4vYCAoaW4gb3JkZXIpXG4gICAgICAgIChrZXljb2RlID4gMjE4ICYmIGtleWNvZGUgPCAyMjMpOyAvLyBbXFxdJyAoaW4gb3JkZXIpXG5cbiAgICAgIC8vIEJsb2NrIHNwZWNpYWwgY2hhcnMgaW4gc3BlY2lhbCBlbGVtZW50c1xuICAgICAgaWYgKFNQRUNJQUxfQ0hBUlMgJiZcbiAgICAgICAgKHN0YXJ0Tm9kZS5wYXJlbnRzKFNQRUNJQUxfU0VDVElPTl9TRUxFQ1RPUikubGVuZ3RoIHx8IGVuZE5vZGUucGFyZW50cyhTUEVDSUFMX1NFQ1RJT05fU0VMRUNUT1IpLmxlbmd0aCkgJiZcbiAgICAgICAgKHN0YXJ0Tm9kZS5wYXJlbnRzKCdoMScpLmxlbmd0aCA+IDAgfHwgZW5kTm9kZS5wYXJlbnRzKCdoMScpLmxlbmd0aCA+IDApKVxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gICAgICAvLyAjIyMgQkFDS1NQQUNFICYmIENBTkMgUFJFU1NFRCAjIyNcbiAgICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAgICAgaWYgKGUua2V5Q29kZSA9PSA4IHx8IGUua2V5Q29kZSA9PSA0Nikge1xuXG4gICAgICAgIC8vbGV0IHRvUmVtb3ZlU2VjdGlvbnMgPSBzZWN0aW9uLmdldFNlY3Rpb25zaW5TZWxlY3Rpb24odGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uKVxuICAgICAgICByYWplX3NlY3Rpb25fZmxhZyA9IHRydWVcblxuICAgICAgICAvLyBQcmV2ZW50IHJlbW92ZSBmcm9tIGhlYWRlclxuICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKE5PTl9FRElUQUJMRV9IRUFERVJfU0VMRUNUT1IpIHx8XG4gICAgICAgICAgKHNlbGVjdGVkRWxlbWVudC5hdHRyKCdkYXRhLW1jZS1jYXJldCcpID09ICdhZnRlcicgJiYgc2VsZWN0ZWRFbGVtZW50LnBhcmVudCgpLmlzKFJBSkVfU0VMRUNUT1IpKSB8fFxuICAgICAgICAgIChzZWxlY3RlZEVsZW1lbnQuYXR0cignZGF0YS1tY2UtY2FyZXQnKSAmJiBzZWxlY3RlZEVsZW1lbnQucGFyZW50KCkuaXMoUkFKRV9TRUxFQ1RPUikpID09ICdiZWZvcmUnKVxuICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIC8vIElmIHNlbGVjdGlvbiBpc24ndCBjb2xsYXBzZWQgbWFuYWdlIGRlbGV0ZVxuICAgICAgICBpZiAoIXRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5pc0NvbGxhcHNlZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHNlY3Rpb24ubWFuYWdlRGVsZXRlKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIFNFTEVDVElPTiBTVEFSVFMgb3IgRU5EUyBpbiBzcGVjaWFsIHNlY3Rpb25cbiAgICAgICAgZWxzZSBpZiAoc3RhcnROb2RlLnBhcmVudHMoU1BFQ0lBTF9TRUNUSU9OX1NFTEVDVE9SKS5sZW5ndGggfHwgZW5kTm9kZS5wYXJlbnRzKFNQRUNJQUxfU0VDVElPTl9TRUxFQ1RPUikubGVuZ3RoKSB7XG5cbiAgICAgICAgICBsZXQgc3RhcnRPZmZzZXQgPSB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuc3RhcnRPZmZzZXRcbiAgICAgICAgICBsZXQgc3RhcnRPZmZzZXROb2RlID0gMFxuICAgICAgICAgIGxldCBlbmRPZmZzZXQgPSB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuZW5kT2Zmc2V0XG4gICAgICAgICAgbGV0IGVuZE9mZnNldE5vZGUgPSB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuZW5kQ29udGFpbmVyLmxlbmd0aFxuXG4gICAgICAgICAgLy8gQ29tcGxldGVseSByZW1vdmUgdGhlIGN1cnJlbnQgc3BlY2lhbCBzZWN0aW9uIGlmIGlzIGVudGlyZWx5IHNlbGVjdGVkXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHNlbGVjdGlvbiBjb250YWlucyB0aGUgZW50aXJlIHNlY3Rpb25cbiAgICAgICAgICAgIHN0YXJ0T2Zmc2V0ID09IHN0YXJ0T2Zmc2V0Tm9kZSAmJiBlbmRPZmZzZXQgPT0gZW5kT2Zmc2V0Tm9kZSAmJlxuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgc2VsZWN0aW9uIHN0YXJ0cyBmcm9tIGgxXG4gICAgICAgICAgICAoc3RhcnROb2RlLnBhcmVudHMoJ2gxJykubGVuZ3RoICE9IGVuZE5vZGUucGFyZW50cygnaDEnKS5sZW5ndGgpICYmIChzdGFydE5vZGUucGFyZW50cygnaDEnKS5sZW5ndGggfHwgZW5kTm9kZS5wYXJlbnRzKCdoMScpLmxlbmd0aCkgJiZcblxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHNlbGVjdGlvbiBlbmRzIGluIHRoZSBsYXN0IGNoaWxkXG4gICAgICAgICAgICAoc3RhcnROb2RlLnBhcmVudHMoU1BFQ0lBTF9TRUNUSU9OX1NFTEVDVE9SKS5jaGlsZHJlbigpLmxlbmd0aCA9PSAkKHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKS5lbmRDb250YWluZXIpLnBhcmVudHNVbnRpbChTUEVDSUFMX1NFQ1RJT05fU0VMRUNUT1IpLmluZGV4KCkgKyAxKSkge1xuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSBjdXJyZW50IHNwZWNpYWwgc2VjdGlvbiBpZiBzZWxlY3Rpb24gaXMgYXQgdGhlIHN0YXJ0IG9mIGgxIEFORCBzZWxlY3Rpb24gaXMgY29sbGFwc2VkIFxuICAgICAgICAgIGlmICh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uaXNDb2xsYXBzZWQoKSAmJiAoc3RhcnROb2RlLnBhcmVudHMoJ2gxJykubGVuZ3RoIHx8IHN0YXJ0Tm9kZS5pcygnaDEnKSkgJiYgc3RhcnRPZmZzZXQgPT0gMCkge1xuXG4gICAgICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzZWN0aW9uIGFuZCB1cGRhdGUgXG4gICAgICAgICAgICAgIHNlbGVjdGVkRWxlbWVudC5wYXJlbnQoU1BFQ0lBTF9TRUNUSU9OX1NFTEVDVE9SKS5yZW1vdmUoKVxuICAgICAgICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcblxuICAgICAgICAgICAgICAvLyBVcGRhdGUgcmVmZXJlbmNlc1xuICAgICAgICAgICAgICB1cGRhdGVSZWZlcmVuY2VzKClcbiAgICAgICAgICAgICAgdXBkYXRlSWZyYW1lRnJvbVNhdmVkQ29udGVudCgpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDaGVrIGlmIGluc2lkZSB0aGUgc2VsZWN0aW9uIHRvIHJlbW92ZSwgdGhlcmUgaXMgYmlibGlvZ3JhcGh5XG4gICAgICAgICAgbGV0IGhhc0JpYmxpb2dyYXBoeSA9IGZhbHNlXG4gICAgICAgICAgJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Q29udGVudCgpKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmlzKEJJQkxJT0dSQVBIWV9TRUxFQ1RPUikpXG4gICAgICAgICAgICAgIGhhc0JpYmxpb2dyYXBoeSA9IHRydWVcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgaWYgKGhhc0JpYmxpb2dyYXBoeSkge1xuXG4gICAgICAgICAgICB0aW55bWNlLmFjdGl2ZUVkaXRvci51bmRvTWFuYWdlci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgLy8gRXhlY3V0ZSBub3JtYWwgZGVsZXRlXG4gICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmV4ZWNDb21tYW5kKCdkZWxldGUnKVxuXG4gICAgICAgICAgICAgIC8vIFVwZGF0ZSBzYXZlZCBjb250ZW50XG4gICAgICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICAgICAgICAgIC8vIFJlbW92ZSBzZWxlY3RvciB3aXRob3V0IGhhZGVyXG4gICAgICAgICAgICAgICQoQklCTElPR1JBUEhZX1NFTEVDVE9SKS5yZW1vdmUoKVxuXG4gICAgICAgICAgICAgIC8vIFVwZGF0ZSBpZnJhbWUgYW5kIHJlc3RvcmUgc2VsZWN0aW9uXG4gICAgICAgICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gaWYgc2VsZWN0aW9uIHN0YXJ0cyBvciBlbmRzIGluIGEgYmlibGlvZW50cnlcbiAgICAgICAgICBpZiAoc3RhcnROb2RlLnBhcmVudHMoQklCTElPRU5UUllfU0VMRUNUT1IpLmxlbmd0aCB8fCBlbmROb2RlLnBhcmVudHMoQklCTElPRU5UUllfU0VMRUNUT1IpLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAvLyBCb3RoIGRlbGV0ZSBldmVudCBhbmQgdXBkYXRlIGFyZSBzdG9yZWQgaW4gYSBzaW5nbGUgdW5kbyBsZXZlbFxuICAgICAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmV4ZWNDb21tYW5kKCdkZWxldGUnKVxuICAgICAgICAgICAgICBzZWN0aW9uLnVwZGF0ZUJpYmxpb2dyYXBoeVNlY3Rpb24oKVxuICAgICAgICAgICAgICB1cGRhdGVSZWZlcmVuY2VzKClcblxuICAgICAgICAgICAgICAvLyB1cGRhdGUgaWZyYW1lXG4gICAgICAgICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cblxuICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAgIC8vICMjIyMjIyMjIyBFTlRFUiBQUkVTU0VEICMjIyMjIyMjI1xuICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAgIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcblxuICAgICAgLy8gV2hlbiBlbnRlciBpcyBwcmVzc2VkIGluc2lkZSBhbiBoZWFkZXIsIG5vdCBhdCB0aGUgZW5kIG9mIGl0XG4gICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKCdoMSxoMixoMyxoNCxoNSxoNicpICYmIHNlbGVjdGVkRWxlbWVudC50ZXh0KCkudHJpbSgpLmxlbmd0aCAhPSB0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Um5nKCkuc3RhcnRPZmZzZXQpIHtcblxuICAgICAgICBzZWN0aW9uLmFkZFdpdGhFbnRlcigpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBzZWxlY3Rpb24gaXMgYmVmb3JlL2FmdGVyIGhlYWRlclxuICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC5pcygncCcpKSB7XG5cbiAgICAgICAgLy8gQmxvY2sgZW50ZXIgYmVmb3JlIGhlYWRlclxuICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmF0dHIoJ2RhdGEtbWNlLWNhcmV0JykgPT0gJ2JlZm9yZScpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG5cblxuICAgICAgICAvLyBBZGQgbmV3IHNlY3Rpb24gYWZ0ZXIgaGVhZGVyXG4gICAgICAgIGlmIChzZWxlY3RlZEVsZW1lbnQuYXR0cignZGF0YS1tY2UtY2FyZXQnKSA9PSAnYWZ0ZXInKSB7XG4gICAgICAgICAgc2VjdGlvbi5hZGQoMSlcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBlbnRlciBpcyBwcmVzc2VkIGluc2lkZSBiaWJsaW9ncmFwaHkgc2VsZWN0b3JcbiAgICAgIGlmIChzZWxlY3RlZEVsZW1lbnQucGFyZW50cyhCSUJMSU9HUkFQSFlfU0VMRUNUT1IpLmxlbmd0aCkge1xuXG4gICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuXG4gICAgICAgIGxldCBpZCA9IGdldFN1Y2Nlc3NpdmVFbGVtZW50SWQoQklCTElPRU5UUllfU0VMRUNUT1IsIEJJQkxJT0VOVFJZX1NVRkZJWClcblxuICAgICAgICAvLyBQcmVzc2luZyBlbnRlciBpbiBoMSB3aWxsIGFkZCBhIG5ldyBiaWJsaW9lbnRyeSBhbmQgY2FyZXQgcmVwb3NpdGlvblxuICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKCdoMScpKSB7XG5cbiAgICAgICAgICBzZWN0aW9uLmFkZEJpYmxpb2VudHJ5KGlkKVxuICAgICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgc2VsZWN0ZWQgZWxlbWVudCBpcyBpbnNpZGUgdGV4dFxuICAgICAgICBlbHNlIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJ3AnKSlcbiAgICAgICAgICBzZWN0aW9uLmFkZEJpYmxpb2VudHJ5KGlkLCBudWxsLCBzZWxlY3RlZEVsZW1lbnQucGFyZW50KCdsaScpKVxuXG5cbiAgICAgICAgLy8gSWYgc2VsZWN0ZWQgZWxlbWVudCBpcyB3aXRob3V0IHRleHRcbiAgICAgICAgZWxzZSBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKCdsaScpKVxuICAgICAgICAgIHNlY3Rpb24uYWRkQmlibGlvZW50cnkoaWQsIG51bGwsIHNlbGVjdGVkRWxlbWVudClcblxuICAgICAgICAvLyBNb3ZlIGNhcmV0ICMxMDVcbiAgICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLnNldEN1cnNvckxvY2F0aW9uKHRpbnltY2UuYWN0aXZlRWRpdG9yLmRvbS5zZWxlY3QoYCR7QklCTElPRU5UUllfU0VMRUNUT1J9IyR7aWR9ID4gcGApWzBdLCBmYWxzZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG5cbiAgICAgIC8vIEFkZGluZyBzZWN0aW9ucyB3aXRoIHNob3J0Y3V0cyAjXG4gICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzKCdwJykgJiYgc2VsZWN0ZWRFbGVtZW50LnRleHQoKS50cmltKCkuc3Vic3RyaW5nKDAsIDEpID09ICcjJykge1xuXG4gICAgICAgIGxldCBsZXZlbCA9IHNlY3Rpb24uZ2V0TGV2ZWxGcm9tSGFzaChzZWxlY3RlZEVsZW1lbnQudGV4dCgpLnRyaW0oKSlcbiAgICAgICAgbGV0IGRlZXBuZXNzID0gJChzZWxlY3RlZEVsZW1lbnQpLnBhcmVudHNVbnRpbChSQUpFX1NFTEVDVE9SKS5sZW5ndGggLSBsZXZlbCArIDFcblxuICAgICAgICAvLyBJbnNlcnQgc2VjdGlvbiBvbmx5IGlmIGNhcmV0IGlzIGluc2lkZSBhYnN0cmFjdCBzZWN0aW9uLCBhbmQgdXNlciBpcyBnb2luZyB0byBpbnNlcnQgYSBzdWIgc2VjdGlvblxuICAgICAgICAvLyBPUiB0aGUgY3Vyc29yIGlzbid0IGluc2lkZSBvdGhlciBzcGVjaWFsIHNlY3Rpb25zXG4gICAgICAgIC8vIEFORCBzZWxlY3RlZEVsZW1lbnQgaXNuJ3QgaW5zaWRlIGEgZmlndXJlXG4gICAgICAgIGlmICgoKHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKEFCU1RSQUNUX1NFTEVDVE9SKS5sZW5ndGggJiYgZGVlcG5lc3MgPiAwKSB8fCAhc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoU1BFQ0lBTF9TRUNUSU9OX1NFTEVDVE9SKS5sZW5ndGgpICYmICFzZWxlY3RlZEVsZW1lbnQucGFyZW50cyhGSUdVUkVfU0VMRUNUT1IpLmxlbmd0aCkge1xuXG4gICAgICAgICAgc2VjdGlvbi5hZGQobGV2ZWwsIHNlbGVjdGVkRWxlbWVudC50ZXh0KCkuc3Vic3RyaW5nKGxldmVsKS50cmltKCkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgZWRpdG9yLm9uKCdOb2RlQ2hhbmdlJywgZnVuY3Rpb24gKGUpIHtcbiAgICBzZWN0aW9uLnVwZGF0ZVNlY3Rpb25Ub29sYmFyKClcbiAgfSlcbn0pXG5cbnNlY3Rpb24gPSB7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIGNhbGxlZCB3aGVuIGEgbmV3IHNlY3Rpb24gbmVlZHMgdG8gYmUgYXR0YWNoZWQsIHdpdGggYnV0dG9uc1xuICAgKi9cbiAgYWRkOiBmdW5jdGlvbiAobGV2ZWwsIHRleHQpIHtcblxuICAgIC8vIFNlbGVjdCBjdXJyZW50IG5vZGVcbiAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBzZWN0aW9uXG4gICAgbGV0IG5ld1NlY3Rpb24gPSB0aGlzLmNyZWF0ZSh0ZXh0ICE9IG51bGwgPyB0ZXh0IDogc2VsZWN0ZWRFbGVtZW50Lmh0bWwoKS50cmltKCksIGxldmVsKVxuXG4gICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBDaGVjayB3aGF0IGtpbmQgb2Ygc2VjdGlvbiBuZWVkcyB0byBiZSBpbnNlcnRlZFxuICAgICAgaWYgKHNlY3Rpb24ubWFuYWdlU2VjdGlvbihzZWxlY3RlZEVsZW1lbnQsIG5ld1NlY3Rpb24sIGxldmVsID8gbGV2ZWwgOiBzZWxlY3RlZEVsZW1lbnQucGFyZW50c1VudGlsKFJBSkVfU0VMRUNUT1IpLmxlbmd0aCkpIHtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbGVjdGVkIHNlY3Rpb25cbiAgICAgICAgc2VsZWN0ZWRFbGVtZW50LnJlbW92ZSgpXG5cbiAgICAgICAgLy8gSWYgdGhlIG5ldyBoZWFkaW5nIGhhcyB0ZXh0IG5vZGVzLCB0aGUgb2Zmc2V0IHdvbid0IGJlIDAgKGFzIG5vcm1hbCkgYnV0IGluc3RlYWQgaXQnbGwgYmUgbGVuZ3RoIG9mIG5vZGUgdGV4dFxuICAgICAgICBtb3ZlQ2FyZXQobmV3U2VjdGlvbi5maW5kKCc6aGVhZGVyJykuZmlyc3QoKVswXSlcblxuICAgICAgICAvLyBVcGRhdGUgZWRpdG9yIGNvbnRlbnRcbiAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG4gICAgICB9XG4gICAgfSlcbiAgfSxcblxuICAvKipcbiAgICogXG4gICAqL1xuICBhZGRPckRvd25VcGdyYWRlOiBmdW5jdGlvbiAoZSwgbGV2ZWwpIHtcblxuICAgIGxldCBzZWxlY3RlZE1lbnVJdGVtID0gJChlLnRhcmdldCkucGFyZW50KCcubWNlLW1lbnUtaXRlbScpXG5cbiAgICBpZiAoc2VsZWN0ZWRNZW51SXRlbS5hdHRyKERBVEFfVVBHUkFERSkpXG4gICAgICByZXR1cm4gdGhpcy51cGdyYWRlKClcblxuICAgIGlmIChzZWxlY3RlZE1lbnVJdGVtLmF0dHIoREFUQV9ET1dOR1JBREUpKVxuICAgICAgcmV0dXJuIHRoaXMuZG93bmdyYWRlKClcblxuICAgIHJldHVybiB0aGlzLmFkZChsZXZlbClcbiAgfSxcblxuICAvKipcbiAgICogRnVuY3Rpb24gY2FsbGVkIHdoZW4gYSBuZXcgc2VjdGlvbiBuZWVkcyB0byBiZSBhdHRhY2hlZCwgd2l0aCBidXR0b25zXG4gICAqL1xuICBhZGRXaXRoRW50ZXI6IGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFNlbGVjdCBjdXJyZW50IG5vZGVcbiAgICBsZXQgc2VsZWN0ZWRFbGVtZW50ID0gJCh0aW55bWNlLmFjdGl2ZUVkaXRvci5zZWxlY3Rpb24uZ2V0Tm9kZSgpKVxuXG4gICAgLy8gSWYgdGhlIHNlY3Rpb24gaXNuJ3Qgc3BlY2lhbFxuICAgIGlmICghc2VsZWN0ZWRFbGVtZW50LnBhcmVudCgpLmF0dHIoJ3JvbGUnKSkge1xuXG4gICAgICBsZXZlbCA9IHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzVW50aWwoUkFKRV9TRUxFQ1RPUikubGVuZ3RoXG5cbiAgICAgIC8vIENyZWF0ZSB0aGUgc2VjdGlvblxuICAgICAgbGV0IG5ld1NlY3Rpb24gPSB0aGlzLmNyZWF0ZShzZWxlY3RlZEVsZW1lbnQudGV4dCgpLnRyaW0oKS5zdWJzdHJpbmcodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldFJuZygpLnN0YXJ0T2Zmc2V0KSwgbGV2ZWwpXG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBDaGVjayB3aGF0IGtpbmQgb2Ygc2VjdGlvbiBuZWVkcyB0byBiZSBpbnNlcnRlZFxuICAgICAgICBzZWN0aW9uLm1hbmFnZVNlY3Rpb24oc2VsZWN0ZWRFbGVtZW50LCBuZXdTZWN0aW9uLCBsZXZlbClcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbGVjdGVkIHNlY3Rpb25cbiAgICAgICAgc2VsZWN0ZWRFbGVtZW50Lmh0bWwoc2VsZWN0ZWRFbGVtZW50LnRleHQoKS50cmltKCkuc3Vic3RyaW5nKDAsIHRpbnltY2UuYWN0aXZlRWRpdG9yLnNlbGVjdGlvbi5nZXRSbmcoKS5zdGFydE9mZnNldCkpXG5cbiAgICAgICAgbW92ZUNhcmV0KG5ld1NlY3Rpb24uZmluZCgnOmhlYWRlcicpLmZpcnN0KClbMF0sIHRydWUpXG5cbiAgICAgICAgLy8gVXBkYXRlIGVkaXRvclxuICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcbiAgICAgIH0pXG4gICAgfSBlbHNlXG4gICAgICBub3RpZnkoJ0Vycm9yLCBoZWFkZXJzIG9mIHNwZWNpYWwgc2VjdGlvbnMgKGFic3RyYWN0LCBhY2tub3dsZWRtZW50cykgY2Fubm90IGJlIHNwbGl0dGVkJywgJ2Vycm9yJywgNDAwMClcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBsYXN0IGluc2VydGVkIGlkXG4gICAqL1xuICBnZXROZXh0SWQ6IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgaWQgPSAwXG4gICAgJCgnc2VjdGlvbltpZF0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ2lkJykuaW5kZXhPZignc2VjdGlvbicpID4gLTEpIHtcbiAgICAgICAgbGV0IGN1cnJJZCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignaWQnKS5yZXBsYWNlKCdzZWN0aW9uJywgJycpKVxuICAgICAgICBpZCA9IGlkID4gY3VycklkID8gaWQgOiBjdXJySWRcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBgc2VjdGlvbiR7aWQrMX1gXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIGFuZCB0aGVuIHJlbW92ZSBldmVyeSBzdWNjZXNzaXZlIGVsZW1lbnRzIFxuICAgKi9cbiAgZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRzOiBmdW5jdGlvbiAoZWxlbWVudCwgZGVlcG5lc3MpIHtcblxuICAgIGxldCBzdWNjZXNzaXZlRWxlbWVudHMgPSAkKCc8ZGl2PjwvZGl2PicpXG5cbiAgICB3aGlsZSAoZGVlcG5lc3MgPj0gMCkge1xuXG4gICAgICBpZiAoZWxlbWVudC5uZXh0QWxsKCc6bm90KC5mb290ZXIpJykpIHtcblxuICAgICAgICAvLyBJZiB0aGUgZGVlcG5lc3MgaXMgMCwgb25seSBwYXJhZ3JhcGggYXJlIHNhdmVkIChub3Qgc2VjdGlvbnMpXG4gICAgICAgIGlmIChkZWVwbmVzcyA9PSAwKSB7XG4gICAgICAgICAgLy8gU3VjY2Vzc2l2ZSBlbGVtZW50cyBjYW4gYmUgcCBvciBmaWd1cmVzXG4gICAgICAgICAgc3VjY2Vzc2l2ZUVsZW1lbnRzLmFwcGVuZChlbGVtZW50Lm5leHRBbGwoYHAsJHtGSUdVUkVfU0VMRUNUT1J9YCkpXG4gICAgICAgICAgZWxlbWVudC5uZXh0QWxsKCkucmVtb3ZlKGBwLCR7RklHVVJFX1NFTEVDVE9SfWApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3VjY2Vzc2l2ZUVsZW1lbnRzLmFwcGVuZChlbGVtZW50Lm5leHRBbGwoKSlcbiAgICAgICAgICBlbGVtZW50Lm5leHRBbGwoKS5yZW1vdmUoKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudCgnc2VjdGlvbicpXG4gICAgICBkZWVwbmVzcy0tXG4gICAgfVxuXG4gICAgcmV0dXJuICQoc3VjY2Vzc2l2ZUVsZW1lbnRzLmh0bWwoKSlcbiAgfSxcblxuICAvKipcbiAgICogXG4gICAqL1xuICBnZXRMZXZlbEZyb21IYXNoOiBmdW5jdGlvbiAodGV4dCkge1xuXG4gICAgbGV0IGxldmVsID0gMFxuICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCB0ZXh0Lmxlbmd0aCA+PSA2ID8gNiA6IHRleHQubGVuZ3RoKVxuXG4gICAgd2hpbGUgKHRleHQubGVuZ3RoID4gMCkge1xuXG4gICAgICBpZiAodGV4dC5zdWJzdHJpbmcodGV4dC5sZW5ndGggLSAxKSA9PSAnIycpXG4gICAgICAgIGxldmVsKytcblxuICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgdGV4dC5sZW5ndGggLSAxKVxuICAgIH1cblxuICAgIHJldHVybiBsZXZlbFxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gSlFldXJ5IG9iamVjdCB0aGF0IHJlcHJlc2VudCB0aGUgc2VjdGlvblxuICAgKi9cbiAgY3JlYXRlOiBmdW5jdGlvbiAodGV4dCwgbGV2ZWwpIHtcbiAgICAvLyBDcmVhdGUgdGhlIHNlY3Rpb25cblxuICAgIC8vIFRyaW0gd2hpdGUgc3BhY2VzIGFuZCBhZGQgemVyb19zcGFjZSBjaGFyIGlmIG5vdGhpbmcgaXMgaW5zaWRlXG5cbiAgICBpZiAodHlwZW9mIHRleHQgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGV4dCA9IHRleHQudHJpbSgpXG4gICAgICBpZiAodGV4dC5sZW5ndGggPT0gMClcbiAgICAgICAgdGV4dCA9IFwiPGJyPlwiXG4gICAgfSBlbHNlXG4gICAgICB0ZXh0ID0gXCI8YnI+XCJcblxuICAgIHJldHVybiAkKGA8c2VjdGlvbiBpZD1cIiR7dGhpcy5nZXROZXh0SWQoKX1cIj48aCR7bGV2ZWx9IGRhdGEtcmFzaC1vcmlnaW5hbC13cmFwcGVyPVwiaDFcIj4ke3RleHR9PC9oJHtsZXZlbH0+PC9zZWN0aW9uPmApXG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIHdoYXQga2luZCBvZiBzZWN0aW9uIG5lZWRzIHRvIGJlIGFkZGVkLCBhbmQgcHJlY2VlZFxuICAgKi9cbiAgbWFuYWdlU2VjdGlvbjogZnVuY3Rpb24gKHNlbGVjdGVkRWxlbWVudCwgbmV3U2VjdGlvbiwgbGV2ZWwpIHtcblxuICAgIGxldCBkZWVwbmVzcyA9ICQoc2VsZWN0ZWRFbGVtZW50KS5wYXJlbnRzVW50aWwoUkFKRV9TRUxFQ1RPUikubGVuZ3RoIC0gbGV2ZWwgKyAxXG5cbiAgICBpZiAoZGVlcG5lc3MgPj0gMCkge1xuXG4gICAgICAvLyBCbG9jayBpbnNlcnQgc2VsZWN0aW9uIGlmIGNhcmV0IGlzIGluc2lkZSBzcGVjaWFsIHNlY3Rpb24sIGFuZCB1c2VyIGlzIGdvaW5nIHRvIGluc2VydCBhIHN1YiBzZWN0aW9uXG4gICAgICBpZiAoKHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKFNQRUNJQUxfU0VDVElPTl9TRUxFQ1RPUikubGVuZ3RoICYmIGRlZXBuZXNzICE9IDEpIHx8IChzZWxlY3RlZEVsZW1lbnQucGFyZW50cyhBQ0tOT1dMRURHRU1FTlRTX1NFTEVDVE9SKS5sZW5ndGggJiZcbiAgICAgICAgICBzZWxlY3RlZEVsZW1lbnQucGFyZW50cyhCSUJMSU9HUkFQSFlfU0VMRUNUT1IpICYmXG4gICAgICAgICAgc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoRU5ETk9URVNfU0VMRUNUT1IpKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgIC8vIEdldCBkaXJlY3QgcGFyZW50IGFuZCBhbmNlc3RvciByZWZlcmVuY2VcbiAgICAgIGxldCBzdWNjZXNzaXZlRWxlbWVudHMgPSB0aGlzLmdldFN1Y2Nlc3NpdmVFbGVtZW50cyhzZWxlY3RlZEVsZW1lbnQsIGRlZXBuZXNzKVxuXG4gICAgICBpZiAoc3VjY2Vzc2l2ZUVsZW1lbnRzLmxlbmd0aClcbiAgICAgICAgbmV3U2VjdGlvbi5hcHBlbmQoc3VjY2Vzc2l2ZUVsZW1lbnRzKVxuXG4gICAgICAvLyBDQVNFOiBzdWIgc2VjdGlvblxuICAgICAgaWYgKGRlZXBuZXNzID09IDApXG4gICAgICAgIHNlbGVjdGVkRWxlbWVudC5hZnRlcihuZXdTZWN0aW9uKVxuXG4gICAgICAvLyBDQVNFOiBzaWJsaW5nIHNlY3Rpb25cbiAgICAgIGVsc2UgaWYgKGRlZXBuZXNzID09IDEpXG4gICAgICAgIHNlbGVjdGVkRWxlbWVudC5wYXJlbnQoJ3NlY3Rpb24nKS5hZnRlcihuZXdTZWN0aW9uKVxuXG4gICAgICAvLyBDQVNFOiBhbmNlc3RvciBzZWN0aW9uIGF0IGFueSB1cGxldmVsXG4gICAgICBlbHNlXG4gICAgICAgICQoc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoJ3NlY3Rpb24nKVtkZWVwbmVzcyAtIDFdKS5hZnRlcihuZXdTZWN0aW9uKVxuXG4gICAgICBoZWFkaW5nRGltZW5zaW9uKClcblxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFxuICAgKi9cbiAgdXBncmFkZTogZnVuY3Rpb24gKCkge1xuXG4gICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcblxuICAgIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJzpoZWFkZXInKSkge1xuXG4gICAgICAvLyBHZXQgdGhlIHJlZmVyZW5jZXMgb2Ygc2VsZWN0ZWQgYW5kIHBhcmVudCBzZWN0aW9uXG4gICAgICBsZXQgc2VsZWN0ZWRTZWN0aW9uID0gc2VsZWN0ZWRFbGVtZW50LnBhcmVudChTRUNUSU9OX1NFTEVDVE9SKVxuICAgICAgbGV0IHBhcmVudFNlY3Rpb24gPSBzZWxlY3RlZFNlY3Rpb24ucGFyZW50KFNFQ1RJT05fU0VMRUNUT1IpXG5cbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgcGFyZW50IHNlY3Rpb24gdXBncmFkZSBpcyBhbGxvd2VkXG4gICAgICBpZiAocGFyZW50U2VjdGlvbi5sZW5ndGgpIHtcblxuICAgICAgICAvLyBFdmVyeXRoaW5nIGluIGhlcmUsIGlzIGFuIGF0b21pYyB1bmRvIGxldmVsXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIC8vIFNhdmUgdGhlIHNlY3Rpb24gYW5kIGRldGFjaFxuICAgICAgICAgIGxldCBib2R5U2VjdGlvbiA9ICQoc2VsZWN0ZWRTZWN0aW9uWzBdLm91dGVySFRNTClcbiAgICAgICAgICBzZWxlY3RlZFNlY3Rpb24uZGV0YWNoKClcblxuICAgICAgICAgIC8vIFVwZGF0ZSBkaW1lbnNpb24gYW5kIG1vdmUgdGhlIHNlY3Rpb24gb3V0XG4gICAgICAgICAgcGFyZW50U2VjdGlvbi5hZnRlcihib2R5U2VjdGlvbilcblxuICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKVxuICAgICAgICAgIGhlYWRpbmdEaW1lbnNpb24oKVxuICAgICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICAvLyBOb3RpZnkgZXJyb3JcbiAgICAgIGVsc2VcbiAgICAgICAgbm90aWZ5KEhFQURJTkdfVFJBU0ZPUk1BVElPTl9GT1JCSURERU4sICdlcnJvcicsIDIwMDApXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGRvd25ncmFkZTogZnVuY3Rpb24gKCkge1xuXG4gICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSlcblxuICAgIGlmIChzZWxlY3RlZEVsZW1lbnQuaXMoJ2gxLGgyLGgzLGg0LGg1LGg2JykpIHtcbiAgICAgIC8vIEdldCB0aGUgcmVmZXJlbmNlcyBvZiBzZWxlY3RlZCBhbmQgc2libGluZyBzZWN0aW9uXG4gICAgICBsZXQgc2VsZWN0ZWRTZWN0aW9uID0gc2VsZWN0ZWRFbGVtZW50LnBhcmVudChTRUNUSU9OX1NFTEVDVE9SKVxuICAgICAgbGV0IHNpYmxpbmdTZWN0aW9uID0gc2VsZWN0ZWRTZWN0aW9uLnByZXYoU0VDVElPTl9TRUxFQ1RPUilcblxuICAgICAgLy8gSWYgdGhlcmUgaXMgYSBwcmV2aW91cyBzaWJsaW5nIHNlY3Rpb24gZG93bmdyYWRlIGlzIGFsbG93ZWRcbiAgICAgIGlmIChzaWJsaW5nU2VjdGlvbi5sZW5ndGgpIHtcblxuICAgICAgICAvLyBFdmVyeXRoaW5nIGluIGhlcmUsIGlzIGFuIGF0b21pYyB1bmRvIGxldmVsXG4gICAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIC8vIFNhdmUgdGhlIHNlY3Rpb24gYW5kIGRldGFjaFxuICAgICAgICAgIGxldCBib2R5U2VjdGlvbiA9ICQoc2VsZWN0ZWRTZWN0aW9uWzBdLm91dGVySFRNTClcbiAgICAgICAgICBzZWxlY3RlZFNlY3Rpb24uZGV0YWNoKClcblxuICAgICAgICAgIC8vIFVwZGF0ZSBkaW1lbnNpb24gYW5kIG1vdmUgdGhlIHNlY3Rpb24gb3V0XG4gICAgICAgICAgc2libGluZ1NlY3Rpb24uYXBwZW5kKGJvZHlTZWN0aW9uKVxuXG4gICAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpXG4gICAgICAgICAgLy8gUmVmcmVzaCB0aW55bWNlIGNvbnRlbnQgYW5kIHNldCB0aGUgaGVhZGluZyBkaW1lbnNpb25cbiAgICAgICAgICBoZWFkaW5nRGltZW5zaW9uKClcbiAgICAgICAgICB1cGRhdGVJZnJhbWVGcm9tU2F2ZWRDb250ZW50KClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOb3RpZnkgZXJyb3JcbiAgICBlbHNlXG4gICAgICBub3RpZnkoSEVBRElOR19UUkFTRk9STUFUSU9OX0ZPUkJJRERFTiwgJ2Vycm9yJywgMjAwMClcbiAgfSxcblxuICAvKipcbiAgICogXG4gICAqL1xuICBhZGRBYnN0cmFjdDogZnVuY3Rpb24gKCkge1xuXG4gICAgaWYgKCEkKEFCU1RSQUNUX1NFTEVDVE9SKS5sZW5ndGgpIHtcblxuICAgICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8vIFRoaXMgc2VjdGlvbiBjYW4gb25seSBiZSBwbGFjZWQgYWZ0ZXIgbm9uIGVkaXRhYmxlIGhlYWRlclxuICAgICAgICAkKE5PTl9FRElUQUJMRV9IRUFERVJfU0VMRUNUT1IpLmFmdGVyKGA8c2VjdGlvbiBpZD1cImRvYy1hYnN0cmFjdFwiIHJvbGU9XCJkb2MtYWJzdHJhY3RcIj48aDE+QWJzdHJhY3Q8L2gxPjwvc2VjdGlvbj5gKVxuXG4gICAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvL21vdmUgY2FyZXQgYW5kIHNldCBmb2N1cyB0byBhY3RpdmUgYWRpdG9yICMxMDVcbiAgICBtb3ZlQ2FyZXQodGlueW1jZS5hY3RpdmVFZGl0b3IuZG9tLnNlbGVjdChgJHtBQlNUUkFDVF9TRUxFQ1RPUn0gPiBoMWApWzBdKVxuICAgIHNjcm9sbFRvKEFCU1RSQUNUX1NFTEVDVE9SKVxuICB9LFxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIGFkZEFja25vd2xlZGdlbWVudHM6IGZ1bmN0aW9uICgpIHtcblxuICAgIGlmICghJChBQ0tOT1dMRURHRU1FTlRTX1NFTEVDVE9SKS5sZW5ndGgpIHtcblxuICAgICAgbGV0IGFjayA9ICQoYDxzZWN0aW9uIGlkPVwiZG9jLWFja25vd2xlZGdlbWVudHNcIiByb2xlPVwiZG9jLWFja25vd2xlZGdlbWVudHNcIj48aDE+QWNrbm93bGVkZ2VtZW50czwvaDE+PC9zZWN0aW9uPmApXG5cbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLnVuZG9NYW5hZ2VyLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBJbnNlcnQgdGhpcyBzZWN0aW9uIGFmdGVyIGxhc3Qgbm9uIHNwZWNpYWwgc2VjdGlvbiBcbiAgICAgICAgLy8gT1IgYWZ0ZXIgYWJzdHJhY3Qgc2VjdGlvbiBcbiAgICAgICAgLy8gT1IgYWZ0ZXIgbm9uIGVkaXRhYmxlIGhlYWRlclxuICAgICAgICBpZiAoJChNQUlOX1NFQ1RJT05fU0VMRUNUT1IpLmxlbmd0aClcbiAgICAgICAgICAkKE1BSU5fU0VDVElPTl9TRUxFQ1RPUikubGFzdCgpLmFmdGVyKGFjaylcblxuICAgICAgICBlbHNlIGlmICgkKEFCU1RSQUNUX1NFTEVDVE9SKS5sZW5ndGgpXG4gICAgICAgICAgJChBQlNUUkFDVF9TRUxFQ1RPUikuYWZ0ZXIoYWNrKVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkKE5PTl9FRElUQUJMRV9IRUFERVJfU0VMRUNUT1IpLmFmdGVyKGFjaylcblxuICAgICAgICB1cGRhdGVJZnJhbWVGcm9tU2F2ZWRDb250ZW50KClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy9tb3ZlIGNhcmV0IGFuZCBzZXQgZm9jdXMgdG8gYWN0aXZlIGFkaXRvciAjMTA1XG4gICAgbW92ZUNhcmV0KHRpbnltY2UuYWN0aXZlRWRpdG9yLmRvbS5zZWxlY3QoYCR7QUNLTk9XTEVER0VNRU5UU19TRUxFQ1RPUn0gPiBoMWApWzBdKVxuICAgIHNjcm9sbFRvKEFDS05PV0xFREdFTUVOVFNfU0VMRUNUT1IpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIHRoZSBtYWluIG9uZS4gSXQncyBjYWxsZWQgYmVjYXVzZSBhbGwgdGltZXMgdGhlIGludGVudCBpcyB0byBhZGQgYSBuZXcgYmlibGlvZW50cnkgKHNpbmdsZSByZWZlcmVuY2UpXG4gICAqIFRoZW4gaXQgY2hlY2tzIGlmIGlzIG5lY2Vzc2FyeSB0byBhZGQgdGhlIGVudGlyZSA8c2VjdGlvbj4gb3Igb25seSB0aGUgbWlzc2luZyA8dWw+XG4gICAqL1xuICBhZGRCaWJsaW9lbnRyeTogZnVuY3Rpb24gKGlkLCB0ZXh0LCBsaXN0SXRlbSkge1xuXG4gICAgLy8gQWRkIGJpYmxpb2dyYXBoeSBzZWN0aW9uIGlmIG5vdCBleGlzdHNcbiAgICBpZiAoISQoQklCTElPR1JBUEhZX1NFTEVDVE9SKS5sZW5ndGgpIHtcblxuICAgICAgbGV0IGJpYmxpb2dyYXBoeSA9ICQoYDxzZWN0aW9uIGlkPVwiZG9jLWJpYmxpb2dyYXBoeVwiIHJvbGU9XCJkb2MtYmlibGlvZ3JhcGh5XCI+PGgxPlJlZmVyZW5jZXM8L2gxPjx1bD48L3VsPjwvc2VjdGlvbj5gKVxuXG4gICAgICAvLyBUaGlzIHNlY3Rpb24gaXMgYWRkZWQgYWZ0ZXIgYWNrbm93bGVkZ2VtZW50cyBzZWN0aW9uXG4gICAgICAvLyBPUiBhZnRlciBsYXN0IG5vbiBzcGVjaWFsIHNlY3Rpb25cbiAgICAgIC8vIE9SIGFmdGVyIGFic3RyYWN0IHNlY3Rpb25cbiAgICAgIC8vIE9SIGFmdGVyIG5vbiBlZGl0YWJsZSBoZWFkZXIgXG4gICAgICBpZiAoJChBQ0tOT1dMRURHRU1FTlRTX1NFTEVDVE9SKS5sZW5ndGgpXG4gICAgICAgICQoQUNLTk9XTEVER0VNRU5UU19TRUxFQ1RPUikuYWZ0ZXIoYmlibGlvZ3JhcGh5KVxuXG4gICAgICBlbHNlIGlmICgkKE1BSU5fU0VDVElPTl9TRUxFQ1RPUikubGVuZ3RoKVxuICAgICAgICAkKE1BSU5fU0VDVElPTl9TRUxFQ1RPUikubGFzdCgpLmFmdGVyKGJpYmxpb2dyYXBoeSlcblxuICAgICAgZWxzZSBpZiAoJChBQlNUUkFDVF9TRUxFQ1RPUikubGVuZ3RoKVxuICAgICAgICAkKEFCU1RSQUNUX1NFTEVDVE9SKS5hZnRlcihiaWJsaW9ncmFwaHkpXG5cbiAgICAgIGVsc2VcbiAgICAgICAgJChOT05fRURJVEFCTEVfSEVBREVSX1NFTEVDVE9SKS5hZnRlcihiaWJsaW9ncmFwaHkpXG5cbiAgICB9XG5cbiAgICAvLyBBZGQgdWwgaW4gYmlibGlvZ3JhcGh5IHNlY3Rpb24gaWYgbm90IGV4aXN0c1xuICAgIGlmICghJChCSUJMSU9HUkFQSFlfU0VMRUNUT1IpLmZpbmQoJ3VsJykubGVuZ3RoKVxuICAgICAgJChCSUJMSU9HUkFQSFlfU0VMRUNUT1IpLmFwcGVuZCgnPHVsPjwvdWw+JylcblxuICAgIC8vIElGIGlkIGFuZCB0ZXh0IGFyZW4ndCBwYXNzZWQgYXMgcGFyYW1ldGVycywgdGhlc2UgY2FuIGJlIHJldHJpZXZlZCBvciBpbml0IGZyb20gaGVyZVxuICAgIGlkID0gKGlkKSA/IGlkIDogZ2V0U3VjY2Vzc2l2ZUVsZW1lbnRJZChCSUJMSU9FTlRSWV9TRUxFQ1RPUiwgQklCTElPRU5UUllfU1VGRklYKVxuICAgIHRleHQgPSB0ZXh0ID8gdGV4dCA6ICc8YnIvPidcblxuICAgIGxldCBuZXdJdGVtID0gJChgPGxpIHJvbGU9XCJkb2MtYmlibGlvZW50cnlcIiBpZD1cIiR7aWR9XCI+PHA+JHt0ZXh0fTwvcD48L2xpPmApXG5cbiAgICAvLyBBcHBlbmQgbmV3IGxpIHRvIHVsIGF0IGxhc3QgcG9zaXRpb25cbiAgICAvLyBPUiBpbnNlcnQgdGhlIG5ldyBsaSByaWdodCBhZnRlciB0aGUgY3VycmVudCBvbmVcbiAgICBpZiAoIWxpc3RJdGVtKVxuICAgICAgJChgJHtCSUJMSU9HUkFQSFlfU0VMRUNUT1J9IHVsYCkuYXBwZW5kKG5ld0l0ZW0pXG5cbiAgICBlbHNlXG4gICAgICBsaXN0SXRlbS5hZnRlcihuZXdJdGVtKVxuICB9LFxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIHVwZGF0ZUJpYmxpb2dyYXBoeVNlY3Rpb246IGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFN5bmNocm9uaXplIGlmcmFtZSBhbmQgc3RvcmVkIGNvbnRlbnRcbiAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcblxuICAgIC8vIFJlbW92ZSBhbGwgc2VjdGlvbnMgd2l0aG91dCBwIGNoaWxkXG4gICAgJChgJHtCSUJMSU9FTlRSWV9TRUxFQ1RPUn06bm90KDpoYXMocCkpYCkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZSgpXG4gICAgfSlcbiAgfSxcblxuICAvKipcbiAgICogXG4gICAqL1xuICBhZGRFbmRub3RlOiBmdW5jdGlvbiAoaWQpIHtcblxuICAgIC8vIEFkZCB0aGUgc2VjdGlvbiBpZiBpdCBub3QgZXhpc3RzXG4gICAgaWYgKCEkKEVORE5PVEVfU0VMRUNUT1IpLmxlbmd0aCkge1xuXG4gICAgICBsZXQgZW5kbm90ZXMgPSAkKGA8c2VjdGlvbiBpZD1cImRvYy1lbmRub3Rlc1wiIHJvbGU9XCJkb2MtZW5kbm90ZXNcIj48aDEgZGF0YS1yYXNoLW9yaWdpbmFsLWNvbnRlbnQ9XCJcIj5Gb290bm90ZXM8L2gxPjwvc2VjdGlvbj5gKVxuXG4gICAgICAvLyBJbnNlcnQgdGhpcyBzZWN0aW9uIGFmdGVyIGJpYmxpb2dyYXBoeSBzZWN0aW9uXG4gICAgICAvLyBPUiBhZnRlciBhY2tub3dsZWRnZW1lbnRzIHNlY3Rpb25cbiAgICAgIC8vIE9SIGFmdGVyIG5vbiBzcGVjaWFsIHNlY3Rpb24gc2VsZWN0b3JcbiAgICAgIC8vIE9SIGFmdGVyIGFic3RyYWN0IHNlY3Rpb25cbiAgICAgIC8vIE9SIGFmdGVyIG5vbiBlZGl0YWJsZSBoZWFkZXIgXG4gICAgICBpZiAoJChCSUJMSU9HUkFQSFlfU0VMRUNUT1IpLmxlbmd0aClcbiAgICAgICAgJChCSUJMSU9HUkFQSFlfU0VMRUNUT1IpLmFmdGVyKGVuZG5vdGVzKVxuXG4gICAgICBlbHNlIGlmICgkKEFDS05PV0xFREdFTUVOVFNfU0VMRUNUT1IpLmxlbmd0aClcbiAgICAgICAgJChBQ0tOT1dMRURHRU1FTlRTX1NFTEVDVE9SKS5hZnRlcihlbmRub3RlcylcblxuICAgICAgZWxzZSBpZiAoJChNQUlOX1NFQ1RJT05fU0VMRUNUT1IpLmxlbmd0aClcbiAgICAgICAgJChNQUlOX1NFQ1RJT05fU0VMRUNUT1IpLmxhc3QoKS5hZnRlcihlbmRub3RlcylcblxuICAgICAgZWxzZSBpZiAoJChBQlNUUkFDVF9TRUxFQ1RPUikubGVuZ3RoKVxuICAgICAgICAkKEFCU1RSQUNUX1NFTEVDVE9SKS5hZnRlcihlbmRub3RlcylcblxuICAgICAgZWxzZVxuICAgICAgICAkKE5PTl9FRElUQUJMRV9IRUFERVJfU0VMRUNUT1IpLmFmdGVyKGVuZG5vdGVzKVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhbmQgYXBwZW5kIHRoZSBuZXcgZW5kbm90ZVxuICAgIGxldCBlbmRub3RlID0gJChgPHNlY3Rpb24gcm9sZT1cImRvYy1lbmRub3RlXCIgaWQ9XCIke2lkfVwiPjxwPjxici8+PC9wPjwvc2VjdGlvbj5gKVxuICAgICQoRU5ETk9URVNfU0VMRUNUT1IpLmFwcGVuZChlbmRub3RlKVxuICB9LFxuXG4gIC8qKlxuICAgKiBcbiAgICovXG4gIHVwZGF0ZVNlY3Rpb25Ub29sYmFyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBEcm9wZG93biBtZW51IHJlZmVyZW5jZVxuICAgIGxldCBtZW51ID0gJChNRU5VX1NFTEVDVE9SKVxuXG4gICAgaWYgKG1lbnUubGVuZ3RoKSB7XG4gICAgICBzZWN0aW9uLnJlc3RvcmVTZWN0aW9uVG9vbGJhcihtZW51KVxuXG4gICAgICAvLyBTYXZlIGN1cnJlbnQgc2VsZWN0ZWQgZWxlbWVudFxuICAgICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9ICQodGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldFJuZygpLnN0YXJ0Q29udGFpbmVyKVxuXG4gICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50WzBdLm5vZGVUeXBlID09IDMpXG4gICAgICAgIHNlbGVjdGVkRWxlbWVudCA9IHNlbGVjdGVkRWxlbWVudC5wYXJlbnQoKVxuXG4gICAgICAvLyBJZiBjdXJyZW50IGVsZW1lbnQgaXMgcFxuICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC5pcygncCcpIHx8IHNlbGVjdGVkRWxlbWVudC5wYXJlbnQoKS5pcygncCcpKSB7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgY2FyZXQgaXMgaW5zaWRlIHNwZWNpYWwgc2VjdGlvblxuICAgICAgICAvLyBJbiB0aGlzIGNhc2UgZW5hYmxlIG9ubHkgZmlyc3QgbWVudWl0ZW0gaWYgY2FyZXQgaXMgaW4gYWJzdHJhY3RcbiAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKFNQRUNJQUxfU0VDVElPTl9TRUxFQ1RPUikubGVuZ3RoKSB7XG5cbiAgICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoQUJTVFJBQ1RfU0VMRUNUT1IpLmxlbmd0aClcbiAgICAgICAgICAgIG1lbnUuY2hpbGRyZW4oYDpsdCgxKWApLnJlbW92ZUNsYXNzKCdtY2UtZGlzYWJsZWQnKVxuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgZGVlcG5lc3Mgb2YgdGhlIHNlY3Rpb25cbiAgICAgICAgbGV0IGRlZXBuZXNzID0gc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoU0VDVElPTl9TRUxFQ1RPUikubGVuZ3RoICsgMVxuXG4gICAgICAgIC8vIFJlbW92ZSBkaXNhYmxpbmcgY2xhc3Mgb24gZmlyc3Qge2RlZXBuZXNzfSBtZW51IGl0ZW1zXG4gICAgICAgIG1lbnUuY2hpbGRyZW4oYDpsdCgke2RlZXBuZXNzfSlgKS5yZW1vdmVDbGFzcygnbWNlLWRpc2FibGVkJylcblxuICAgICAgICAvLyBHZXQgdGhlIHNlY3Rpb24gbGlzdCBhbmQgdXBkYXRlIHRoZSBkcm9wZG93biB3aXRoIHRoZSByaWdodCB0ZXh0c1xuICAgICAgICBsZXQgbGlzdCA9IHNlY3Rpb24uZ2V0QW5jZXN0b3JTZWN0aW9uc0xpc3Qoc2VsZWN0ZWRFbGVtZW50KVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbWVudS5jaGlsZHJlbihgOmVxKCR7aX0pYCkuZmluZCgnc3Bhbi5tY2UtdGV4dCcpLnRleHQobGlzdFtpXSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBFbmFibGUgb25seSBmb3IgdXBncmFkZS9kb3duZ3JhZGVcbiAgICAgIGVsc2UgaWYgKCFzZWxlY3RlZEVsZW1lbnQucGFyZW50cyhTUEVDSUFMX1NFQ1RJT05fU0VMRUNUT1IpLmxlbmd0aCAmJiBzZWxlY3RlZEVsZW1lbnQuaXMoJ2gxLGgyLGgzJykpIHtcblxuICAgICAgICAvLyBHZXQgdGhlIHNlbGVjdGVkIHNlY3Rpb25cbiAgICAgICAgbGV0IHNlbGVjdGVkU2VjdGlvbiA9IHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKFNFQ1RJT05fU0VMRUNUT1IpLmZpcnN0KClcblxuICAgICAgICAvLyBHZXQgdGhlIG51bWJlciBvZiB0aGUgaGVhZGluZyAoZWcuIEgxID0+IDEsIEgyID0+IDIpXG4gICAgICAgIGxldCBpbmRleCA9IHBhcnNlSW50KHNlbGVjdGVkRWxlbWVudC5wcm9wKCd0YWdOYW1lJykudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdoJywgJycpKVxuXG4gICAgICAgIC8vIEdldCB0aGUgZGVlcG5lc3Mgb2YgdGhlIHNlY3Rpb24gKGVnLiAxIGlmIGlzIGEgbWFpbiBzZWN0aW9uLCAyIGlmIGlzIGEgc3Vic2VjdGlvbilcbiAgICAgICAgbGV0IGRlZXBuZXNzID0gc2VsZWN0ZWRFbGVtZW50LnBhcmVudHMoU0VDVElPTl9TRUxFQ1RPUikubGVuZ3RoXG5cbiAgICAgICAgLy8gR2V0IHRoZSBsaXN0IG9mIHRleHRzIHRoYXQgYXJlIGJlZVxuICAgICAgICBsZXQgbGlzdCA9IHNlY3Rpb24uZ2V0QW5jZXN0b3JTZWN0aW9uc0xpc3Qoc2VsZWN0ZWRFbGVtZW50KVxuXG4gICAgICAgIC8vIFRoZSB0ZXh0IGluZGV4IGluIGxpc3RcbiAgICAgICAgbGV0IGkgPSBkZWVwbmVzcyAtIGluZGV4XG5cbiAgICAgICAgLy8gVXBkYXRlIHRleHQgdXBncmFkZSBhbmQgZG93bmdyYWRlXG4gICAgICAgIG1lbnUuY2hpbGRyZW4oYDplcSgkezB9KWApLmZpbmQoJ3NwYW4ubWNlLXRleHQnKS50ZXh0KCdVcGdyYWRlJylcbiAgICAgICAgbWVudS5jaGlsZHJlbihgOmVxKCR7MX0pYCkuZmluZCgnc3Bhbi5tY2UtdGV4dCcpLnRleHQoJ0Rvd25ncmFkZScpXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGN1cnJlbnQgc2VjdGlvbiBoYXMgYSBwYXJlbnRcbiAgICAgICAgLy8gSW4gdGhpcyBjYXNlIHRoZSB1cGdyYWRlIGlzIHBlcm1pdHRlZFxuICAgICAgICBpZiAoc2VsZWN0ZWRTZWN0aW9uLnBhcmVudChTRUNUSU9OX1NFTEVDVE9SKS5sZW5ndGgpIHtcblxuICAgICAgICAgIC8vIG1lbnUgaXRlbSBpbnNpZGUgdGhlIGRyb3Bkb3duXG4gICAgICAgICAgbGV0IG1lbnVJdGVtID0gbWVudS5jaGlsZHJlbihgOmVxKCR7MH0pYClcbiAgICAgICAgICBtZW51SXRlbS5yZW1vdmVDbGFzcygnbWNlLWRpc2FibGVkJylcbiAgICAgICAgICBtZW51SXRlbS5hdHRyKERBVEFfVVBHUkFERSwgdHJ1ZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxlY3RlZFNlY3Rpb24ucHJldigpLmlzKFNFQ1RJT05fU0VMRUNUT1IpKSB7XG5cbiAgICAgICAgICAvLyBtZW51IGl0ZW0gaW5zaWRlIHRoZSBkcm9wZG93blxuICAgICAgICAgIGxldCBtZW51SXRlbSA9IG1lbnUuY2hpbGRyZW4oYDplcSgkezF9KWApXG4gICAgICAgICAgbWVudUl0ZW0ucmVtb3ZlQ2xhc3MoJ21jZS1kaXNhYmxlZCcpXG4gICAgICAgICAgbWVudUl0ZW0uYXR0cihEQVRBX0RPV05HUkFERSwgdHJ1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBEaXNhYmxlIGluIGFueSBvdGhlciBjYXNlc1xuICAgICAgZWxzZVxuICAgICAgICBtZW51LmNoaWxkcmVuKCc6Z3QoMTApJykuYWRkQ2xhc3MoJ21jZS1kaXNhYmxlZCcpXG4gICAgfVxuICB9LFxuXG4gIGdldEFuY2VzdG9yU2VjdGlvbnNMaXN0OiBmdW5jdGlvbiAoc2VsZWN0ZWRFbGVtZW50KSB7XG5cbiAgICBsZXQgcHJlSGVhZGVycyA9IFtdXG4gICAgbGV0IGxpc3QgPSBbXVxuICAgIGxldCBwYXJlbnRTZWN0aW9ucyA9IHNlbGVjdGVkRWxlbWVudC5wYXJlbnRzKCdzZWN0aW9uJylcblxuICAgIC8vIFNhdmUgaW5kZXggb2YgYWxsIHBhcmVudCBzZWN0aW9uc1xuICAgIGZvciAobGV0IGkgPSBwYXJlbnRTZWN0aW9ucy5sZW5ndGg7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGxldCBlbGVtID0gJChwYXJlbnRTZWN0aW9uc1tpIC0gMV0pXG4gICAgICBsZXQgaW5kZXggPSBlbGVtLnBhcmVudCgpLmNoaWxkcmVuKFNFQ1RJT05fU0VMRUNUT1IpLmluZGV4KGVsZW0pICsgMVxuICAgICAgcHJlSGVhZGVycy5wdXNoKGluZGV4KVxuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0ZXh0IG9mIGFsbCBtZW51IGl0ZW1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBwcmVIZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIGxldCB0ZXh0ID0gYCR7SEVBRElOR30gYFxuXG4gICAgICAvLyBVcGRhdGUgdGV4dCBiYXNlZCBvbiBzZWN0aW9uIHN0cnVjdHVyZVxuICAgICAgaWYgKGkgIT0gcHJlSGVhZGVycy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPD0gaTsgeCsrKVxuICAgICAgICAgIHRleHQgKz0gYCR7cHJlSGVhZGVyc1t4XSArICh4ID09IGkgPyAxIDogMCl9LmBcbiAgICAgIH1cblxuICAgICAgLy8gSW4gdGhpcyBjYXNlIHJhamUgY2hhbmdlcyB0ZXh0IG9mIG5leHQgc3ViIGhlYWRpbmdcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGk7IHgrKylcbiAgICAgICAgICB0ZXh0ICs9IGAke3ByZUhlYWRlcnNbeF19LmBcblxuICAgICAgICB0ZXh0ICs9ICcxLidcbiAgICAgIH1cblxuICAgICAgbGlzdC5wdXNoKHRleHQpXG4gICAgfVxuXG4gICAgcmV0dXJuIGxpc3RcbiAgfSxcblxuICAvKipcbiAgICogUmVzdG9yZSBub3JtYWwgdGV4dCBpbiBzZWN0aW9uIHRvb2xiYXIgYW5kIGRpc2FibGUgYWxsXG4gICAqL1xuICByZXN0b3JlU2VjdGlvblRvb2xiYXI6IGZ1bmN0aW9uIChtZW51KSB7XG5cbiAgICBsZXQgY250ID0gMVxuXG4gICAgbWVudS5jaGlsZHJlbignOmx0KDYpJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgdGV4dCA9IGAke0hFQURJTkd9IGBcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbnQ7IGkrKylcbiAgICAgICAgdGV4dCArPSBgMS5gXG5cbiAgICAgIC8vIFJlbW92ZSBkYXRhIGVsZW1lbnRzXG4gICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoREFUQV9VUEdSQURFKVxuICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKERBVEFfRE9XTkdSQURFKVxuXG4gICAgICAkKHRoaXMpLmZpbmQoJ3NwYW4ubWNlLXRleHQnKS50ZXh0KHRleHQpXG4gICAgICAkKHRoaXMpLmFkZENsYXNzKCdtY2UtZGlzYWJsZWQnKVxuXG4gICAgICBjbnQrK1xuICAgIH0pXG5cbiAgICAvLyBFbmFibGUgdXBncmFkZS9kb3duZ3JhZGUgbGFzdCB0aHJlZSBtZW51IGl0ZW1zXG4gICAgbWVudS5jaGlsZHJlbignOmd0KDEwKScpLnJlbW92ZUNsYXNzKCdtY2UtZGlzYWJsZWQnKVxuICB9LFxuXG4gIG1hbmFnZURlbGV0ZTogZnVuY3Rpb24gKCkge1xuXG4gICAgbGV0IHJhbmdlID0gdGlueW1jZS5hY3RpdmVFZGl0b3Iuc2VsZWN0aW9uLmdldFJuZygpXG4gICAgbGV0IHN0YXJ0Tm9kZSA9ICQocmFuZ2Uuc3RhcnRDb250YWluZXIpLnBhcmVudCgpXG4gICAgbGV0IGVuZE5vZGUgPSAkKHJhbmdlLmVuZENvbnRhaW5lcikucGFyZW50KClcbiAgICBsZXQgY29tbW9uQW5jZXN0b3JDb250YWluZXIgPSAkKHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyKVxuXG4gICAgLy8gRGVlcG5lc3MgaXMgcmVsYXRpdmUgdG8gdGhlIGNvbW1vbiBhbmNlc3RvciBjb250YWluZXIgb2YgdGhlIHJhbmdlIHN0YXJ0Q29udGFpbmVyIGFuZCBlbmRcbiAgICBsZXQgZGVlcG5lc3MgPSBlbmROb2RlLnBhcmVudCgnc2VjdGlvbicpLnBhcmVudHNVbnRpbChjb21tb25BbmNlc3RvckNvbnRhaW5lcikubGVuZ3RoICsgMVxuICAgIGxldCBjdXJyZW50RWxlbWVudCA9IGVuZE5vZGVcbiAgICBsZXQgdG9Nb3ZlRWxlbWVudHMgPSBbXVxuXG4gICAgdGlueW1jZS5hY3RpdmVFZGl0b3IudW5kb01hbmFnZXIudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBHZXQgYW5kIGRldGFjaCBhbGwgbmV4dF9lbmRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGRlZXBuZXNzOyBpKyspIHtcbiAgICAgICAgY3VycmVudEVsZW1lbnQubmV4dEFsbCgnc2VjdGlvbixwLGZpZ3VyZSxwcmUsdWwsb2wnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0b01vdmVFbGVtZW50cy5wdXNoKCQodGhpcykpXG5cbiAgICAgICAgICAkKHRoaXMpLmRldGFjaCgpXG4gICAgICAgIH0pXG4gICAgICAgIGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQucGFyZW50KClcbiAgICAgIH1cblxuICAgICAgLy8gRXhlY3V0ZSBkZWxldGVcbiAgICAgIHRpbnltY2UuYWN0aXZlRWRpdG9yLmV4ZWNDb21tYW5kKCdkZWxldGUnKVxuXG4gICAgICAvLyBEZXRhY2ggYWxsIG5leHRfYmVnaW5cbiAgICAgIHN0YXJ0Tm9kZS5uZXh0QWxsKCkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuZGV0YWNoKClcbiAgICAgIH0pXG5cbiAgICAgIC8vIEFwcGVuZCBhbGwgbmV4dF9lbmQgdG8gc3RhcnRub2RlIHBhcmVudFxuICAgICAgdG9Nb3ZlRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBzdGFydE5vZGUucGFyZW50KCdzZWN0aW9uJykuYXBwZW5kKGVsZW1lbnQpXG4gICAgICB9KVxuXG4gICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKClcblxuICAgICAgLy8gUmVmcmVzaCBoZWFkaW5nc1xuICAgICAgaGVhZGluZ0RpbWVuc2lvbigpXG5cbiAgICAgIC8vIFVwZGF0ZSByZWZlcmVuY2VzIGlmIG5lZWRlZFxuICAgICAgdXBkYXRlUmVmZXJlbmNlcygpXG5cbiAgICAgIHVwZGF0ZUlmcmFtZUZyb21TYXZlZENvbnRlbnQoKVxuICAgIH0pXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0iXX0=
