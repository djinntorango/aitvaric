(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Navigation

  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNavigation(menuButton, menuList);
    });

    menuList.addEventListener("keyup", (event) => {
      if (event.keyCode === ESCAPE) {
        event.stopPropagation();
        closeNavigation(menuButton, menuList);
      }
    });

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      element.addEventListener("click", () => {
        toggleNavigation(toggle, element);
      });

      element.addEventListener("keyup", (event) => {
        console.log("escape");
        if (event.keyCode === ESCAPE) {
          closeNavigation(toggle, element);
        }
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

        // Add event handler for click
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;

      this.toggle.removeAttribute("aria-expanded");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", true);
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;

      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();

      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      // look up starting from current index
      let index = itemChars.indexOf(char, startIndex);

      // if not found, start from start
      if (index === -1) {
        index = itemChars.indexOf(char, 0);
      }

      if (index > -1) {
        this.focusByIndex(index);
      }
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;

      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusLastMenuItem();
          break;
        }
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (key) {
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home":
        case "PageUp": {
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End":
        case "PageDown": {
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Drodowns

  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share

  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Vanilla JS debounce function, by Josh W. Comeau:
  // https://www.joshwcomeau.com/snippets/javascript/debounce/
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Define variables for search field
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  // Clear the search input, and then return focus to it
  function clearSearchInput(event) {
    event.target
      .closest(searchFormSelector)
      .classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    input.value = "";
    input.focus();
  }

  // Have the search input and clear button respond
  // when someone presses the escape key, per:
  // https://twitter.com/adambsilver/status/1152452833234554880
  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

// Create an HTML button that all users -- especially keyboard users --
// can interact with, to clear the search input.
// To learn more about this, see:
// https://adrianroselli.com/2019/07/ignore-typesearch.html#Delete
// https://www.scottohara.me/blog/2022/02/19/custom-clear-buttons.html
function buildClearSearchButton(inputId) {
  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("aria-controls", inputId);
  button.classList.add("clear-button");

  // Sanitize the button label before setting it
  const buttonLabel = sanitize(window.searchClearButtonLabelLocalized);
  
  const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;

  // Use createTextNode to set the button label text content
  const labelTextNode = document.createTextNode(buttonLabel);
  button.appendChild(labelTextNode);
  
  button.innerHTML = icon;

  button.addEventListener("click", clearSearchInput);
  button.addEventListener("keyup", clearSearchInputOnKeypress);

  return button;
}

// Sanitize the button label to prevent XSS using custom sanitizer
function sanitize(string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match) => map[match]);
}


  // Append the clear button to the search form
  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  // Add a class to the search form when the input has a value;
  // Remove that class from the search form when the input doesn't have a value.
  // Do this on a delay, rather than on every keystroke.
  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(
      searchFormFilledClassName,
      event.target.value.length > 0
    );
  }, 200);

  // Search

  window.addEventListener("DOMContentLoaded", () => {
    // Set up clear functionality for the search field
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });
  });

  const key = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms

  window.addEventListener("DOMContentLoaded", () => {
    // In some cases we should preserve focus after page reload
    returnFocus();

    // show form controls when the textarea receives focus or back button is used and value exists
    const commentContainerTextarea = document.querySelector(
      ".comment-container textarea"
    );
    const commentContainerFormControls = document.querySelector(
      ".comment-form-controls, .comment-ccs"
    );

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener(
        "focus",
        function focusCommentContainerTextarea() {
          commentContainerFormControls.style.display = "block";
          commentContainerTextarea.removeEventListener(
            "focus",
            focusCommentContainerTextarea
          );
        }
      );

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    // Expand Request comment form when Add to conversation is clicked
    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        requestCommentSubmit.style.display = "inline-block";

        if (commentContainerTextarea) {
          commentContainerTextarea.focus();
        }
      });
    }

    // Mark as solved button
    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    // Change Mark as solved text according to whether comment is filled
    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    const usesWysiwyg =
      requestCommentTextarea &&
      requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) {
      return s.trim() === "";
    }

    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }

    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute(
                "data-solve-and-submit-translation"
              );
          }
        }
      });
    }

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );

    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    // Submit requests filter form on search in the request list page
    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    // Submit organization form in the request page
    const requestOrganisationSelect = document.querySelector(
      "#request-organization select"
    );

    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });

      requestOrganisationSelect.addEventListener("click", (e) => {
        // Prevents Ticket details collapsible-sidebar to close on mobile
        e.stopPropagation();
      });
    }

    // If there are any error notifications below an input field, focus that field
    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

})();

document.addEventListener("DOMContentLoaded", function () {
  const categoryToggles = document.querySelectorAll(".category-toggle");

  categoryToggles.forEach(function (toggle) {
    toggle.addEventListener("click", function (e) {
      // Check if the click was on an accordion item link
      if (e.target.closest(".accordion-item-link")) {
        // Link was clicked, allow the default behavior
        return;
      }

      e.preventDefault();
      const accordion = this.querySelector(".accordion");
      const blocksItem = this.querySelector(".blocks-item");

      // Check if the clicked category block is already active
      const isActive = accordion.classList.contains("active-accordion");

      // Remove "active-accordion" class from all category blocks
      categoryToggles.forEach(function (otherToggle) {
        otherToggle.querySelector(".accordion").classList.remove("active-accordion");
        otherToggle.querySelector(".blocks-item").classList.remove("active-blocks-item");
      });

      if (!isActive) {
        // Add "active-accordion" class to the clicked category block
        accordion.classList.add("active-accordion");
        blocksItem.classList.add("active-blocks-item");
      } else {
        // If the block is already active, close it
        accordion.classList.remove("active-accordion");
        blocksItem.classList.remove("active-blocks-item");
      }
    });
  });
});




/***** Side panel navigation api requests & construction *****/
// Store your domain in a var to use in api requests for category/section data
  var domain = window.location.hostname;

document.addEventListener('DOMContentLoaded', function () {

  // Make an API call to get categories using your domain
  const apiUrl = `https://${domain}/api/v2/help_center/en-us/categories?per_page=100.json`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(categoriesData => {
      // Process the data to prepare it for rendering
      const processedData = processCategoriesData(categoriesData);

      // Fetch sections for each category and render categories after all sections are fetched
      return fetchSectionsForCategories(processedData.categories);
    })
    .then(updatedCategories => {
      // Render categories into the template after fetching sections for all categories
      renderCategories({ categories: updatedCategories });
    })
    .catch(error => {
      console.error('API request failed', error);
    });
});

// Function to fetch sections for each category
function fetchSectionsForCategories(categories) {
  // Create an array to hold promises for each fetch operation
  const sectionPromises = categories.map(category => {
    const sectionApiUrl = `https://${domain}/api/v2/help_center/en-us/categories/${category.id}/sections?per_page=100.json`;

    return fetch(sectionApiUrl)
      .then(response => response.json())
      .then(sectionsData => {
        // Process the sections data if needed
        const processedSections = processSectionsData(sectionsData);

        // Update the category object with sections
        return {
          ...category,
          sections: processedSections
        };
      })
      .catch(error => {
        console.error(`Failed to fetch sections for category ${category.id}`, error);
        return category; // Return the category even if fetching sections fails
      });
  });

  // Use Promise.all to wait for all fetch operations to complete
  return Promise.all(sectionPromises);
}

// Function to process sections data (adjust based on your actual data structure)
function processSectionsData(sectionsData) {
  if (sectionsData && Array.isArray(sectionsData.sections)) {
    // Assuming sectionsData is an object with a "sections" property containing an array of section objects
    const sectionsMap = new Map();

    // Create a map of sections using section ID as the key
    sectionsData.sections.forEach(section => {
      sectionsMap.set(section.id, {
        id: section.id,
        name: section.name,
        parentSectionId: section.parent_section_id
      });
    });

    // Organize sections into a hierarchy based on parentSectionId
    const organizedSections = [];

    sectionsMap.forEach(section => {
      if (section.parentSectionId) {
        const parentSection = sectionsMap.get(section.parentSectionId);
        if (parentSection) {
          // Add the section as a child of the parent section
          parentSection.children = parentSection.children || [];
          parentSection.children.push(section);
        }
      } else {
        // Add top-level sections (those without a parent) to the organizedSections array
        organizedSections.push(section);
      }
    });

    return organizedSections;
  } else {
    console.error('Invalid sections data:', sectionsData);
    return []; // Return an empty array if the data is not as expected
  }
}

// Function to process categories data (adjust based on your actual data structure)
function processCategoriesData(categoriesData) {
  // Assuming categoriesData is an array of category objects
  return {
    categories: categoriesData.categories.map(category => ({
      name: category.name,
      id: category.id
    }))
  };
}

// Function to render categories into the template
function renderCategories(data) {
  const categoriesList = document.getElementById('categories-list');
  const topCategoriesList = document.getElementById('top-categories-list');

  // Clear any existing content
  categoriesList.innerHTML = '';
  topCategoriesList.innerHTML = '';

  // Render categories dynamically
  data.categories.forEach(category => {
    // Create a separate categoryItem for each list
    const categoryItemForCategoriesList = document.createElement('li');
    const categoryItemForTopCategoriesList = document.createElement('li');

    const categoryLink = document.createElement('a');

    // Set the href attribute to the URL with the category ID
    categoryLink.href = `https://${domain}/hc/en-us/categories/${category.id}-${encodeURIComponent(category.name)}`;

    // Set the text content of the anchor element
    categoryLink.textContent = category.name;

    // Append the anchor element to the list item for categoriesList
    categoryItemForCategoriesList.appendChild(categoryLink);

    // Append the anchor element to the list item for topCategoriesList
    categoryItemForTopCategoriesList.appendChild(categoryLink.cloneNode(true));

    // If the category has sections, render them
    if (category.sections && category.sections.length > 0) {
      renderSections(category.sections, categoryItemForCategoriesList);
      renderSections(category.sections, categoryItemForTopCategoriesList);
    }

    // Append the list items to their respective lists
    categoriesList.appendChild(categoryItemForCategoriesList);
    topCategoriesList.appendChild(categoryItemForTopCategoriesList);
  });
}

function renderSections(sections, parentElement) {
  const sectionsList = document.createElement('ul');
  sectionsList.classList.add('sections-list');

  sections.forEach(section => {
    const sectionItem = document.createElement('li');
    sectionItem.classList.add('open-section'); // Add a class for styling

    // Container for the link and chevron
    const linkContainer = document.createElement('div');
    linkContainer.classList.add('link-container');
    
    // Set the href attribute to the URL with the section ID
    const sectionLink = document.createElement('a');
    sectionLink.href = `https://${domain}/hc/en-us/sections/${section.id}-${encodeURIComponent(section.name)}`;
    sectionLink.textContent = section.name;
    linkContainer.appendChild(sectionLink);

    // If the section has children, append a chevron for toggling visibility
    if (section.children && section.children.length > 0) {
      const chevron = document.createElement('span');
      chevron.classList.add('chevron');
      linkContainer.appendChild(chevron);
    }

    // Append the link container to the section item
    sectionItem.appendChild(linkContainer);

    // If the section has children, render subsections recursively
    if (section.children && section.children.length > 0) {
      const subsectionsList = document.createElement('ul');
      subsectionsList.classList.add('subsections-list');


      // Render subsections recursively
      renderSections(section.children, subsectionsList);

      // Append the subsections list to the section item
      sectionItem.appendChild(subsectionsList);
    }

    // Append the section item to the sections list
    sectionsList.appendChild(sectionItem);
  });

  // Append the sections list to the parent element
  parentElement.appendChild(sectionsList);
}

document.addEventListener('click', function (event) {
  const chevron = event.target;
  if (chevron.classList.contains('chevron')) {
    const parentSection = chevron.closest('.open-section');
    const subsectionsList = parentSection.querySelector('.subsections-list');
    subsectionsList.style.display = subsectionsList.style.display === 'block' ? 'none' : 'block';
    chevron.classList.toggle('rotate-chevron');
  }
});
document.addEventListener('click', function (event) {
  const clickedElement = event.target;
  const topPanel = clickedElement.closest('.top-panel-cl');
  const topChevron = document.querySelector('.top-chevron');
  const topCategoriesList = document.getElementById('top-categories-list');

  // Check if the clicked element or its ancestor has the class 'top-panel-cl'
  if (topPanel) {
    if (topCategoriesList) {
      // Toggle the display property of top-categories-list
      topCategoriesList.style.display = topCategoriesList.style.display === 'block' ? 'none' : 'block';
      topChevron.classList.toggle('rotate-chevron');
    }
  }
});

// Table of Contents
document.addEventListener('DOMContentLoaded', function () {
    const headerHeight = 80; // To accomodate the fixed header
    const hElements = document.querySelectorAll('h1, h2');

    // Create a list and append each h3 element to it
    const tocList = document.createElement('ul');
    hElements.forEach(hElement => {
        // Create a clickable link
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = hElement.textContent;
        link.href = `#${hElement.id}`;
        link.addEventListener('click', function (event) {
            event.preventDefault();

            // Adjust the scroll position
            const targetScrollPosition = hElement.offsetTop - headerHeight;

            window.scrollTo({
                top: targetScrollPosition,
                behavior: 'smooth',
            });
        });
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });

    const tocContainer = document.querySelector('.toc');
    if (tocContainer) {
        tocContainer.appendChild(tocList);
    }
});

/***** Add Fancyboxes to images inside articles *****/
document.addEventListener('DOMContentLoaded', function() {
  var imgElements = document.querySelectorAll('.article-body img');
  imgElements.forEach(function(img) {
    var imgSrc = img.getAttribute('src');
    var anchor = document.createElement('a');
    anchor.setAttribute('href', imgSrc);
    anchor.classList.add('fancybox');
    var newImg = document.createElement('img');
    newImg.setAttribute('src', imgSrc);
    anchor.appendChild(newImg);
    img.parentNode.replaceChild(anchor, img);
  });
});

// Function to toggle dark mode
function toggleDarkMode() {
  const body = document.body;
  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false'); // Store preference
  } else {
    body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true'); // Store preference
  }
}

// Add event listeners to your dark mode toggle switches
const desktopDarkToggle = document.querySelector('.slider');
const mobileDarkToggle = document.querySelector('.slider-mobile');

if (desktopDarkToggle && mobileDarkToggle) {
  desktopDarkToggle.addEventListener('change', toggleDarkMode);
  mobileDarkToggle.addEventListener('change', toggleDarkMode);
}

// Check stored preference and set initial state
const storedDarkMode = localStorage.getItem('darkMode');
if (desktopDarkToggle && mobileDarkToggle) {
  if (storedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
    desktopDarkToggle.checked = true;
    mobileDarkToggle.checked = true;
  }

  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (prefersDarkMode && storedDarkMode !== 'false') {
    document.body.classList.add('dark-mode');
    desktopDarkToggle.checked = true;
    mobileDarkToggle.checked = true;
  }

  // Add event listeners to your dark mode toggle switches
  desktopDarkToggle.addEventListener('change', toggleDarkMode);
  mobileDarkToggle.addEventListener('change', toggleDarkMode);
}

// Import Mixpanel and initialize it
mixpanel.init("4c504c9fcc20e32766f3b79a083962bb", {
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
});

// Example of tracking a page view event
mixpanel.track("Page Viewed", {
  page: document.title,
});

// Function to track events in Mixpanel
function trackEvent(eventName, properties = {}) {
  console.log("Tracking event:", eventName, properties); // Debugging
  mixpanel.track(eventName, {
    ...properties,
    page: document.title,
    url: window.location.href,
  });
}



// Wait for the Zendesk Web SDK to be ready
window.zE('messenger:on', 'open', function() {
  trackEvent('Messaging Widget Opened');
});

window.zE('messenger:on', 'close', function() {
  trackEvent('Messaging Widget Closed');
});

window.zE('messenger:on', 'unreadMessages', function(count) {
  if (count === 1) {  
    trackEvent('Unread Messages', { count: count });
  } else if (count === 0) {
    return
  }
});
