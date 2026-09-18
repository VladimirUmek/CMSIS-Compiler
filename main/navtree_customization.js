/*
 * Make an expandable navigation-tree label behave like its arrow: clicking
 * either control expands or collapses the node. Doxygen normally makes a
 * linked label navigate immediately, even when the node has children.
 *
 * The listener runs in the capture phase so it can replace Doxygen's label
 * click handler before that handler navigates. Leaf labels and modified
 * clicks retain their normal link behavior.
 *
 * Unlike the default Doxygen initialization, the documentation landing page
 * explicitly opens the project root and its first child (normally
 * "Overview"), making the first section list visible immediately.
 */
(function () {
  "use strict";

  function isIndexPage() {
    const page = window.location.pathname.split("/").pop();
    return page === "" || page === "index.html";
  }

  function expandItem(item) {
    const expandToggle = item ? item.querySelector(":scope > a") : null;
    if (!expandToggle || !expandToggle.querySelector(".arrow")) {
      return false;
    }

    // Do not toggle an item closed if Doxygen has already expanded it while
    // synchronizing the tree with the current page.
    if (!expandToggle.querySelector(".arrowhead.opened")) {
      expandToggle.click();
    }
    return true;
  }

  function expandFirstBranch() {
    const rootItem = document.querySelector(
      "#nav-tree-contents > ul > li:first-child > .item"
    );
    if (!expandItem(rootItem)) {
      return false;
    }

    // Expand the first child below the project root (normally "Overview") so
    // its section list is visible when the landing page opens.
    const firstChildItem = document.querySelector(
      "#nav-tree-contents > ul > li:first-child > ul.children_ul " +
      "> li:first-child > .item"
    );
    if (!firstChildItem) {
      return false;
    }

    // A first child without descendants needs no further expansion.
    expandItem(firstChildItem);
    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!isIndexPage()) {
      return;
    }

    // Doxygen constructs the navigation tree after DOMContentLoaded and may
    // load parts of it asynchronously. Observe the tree until its first
    // branch exists, expand it once, and then stop observing.
    const navTreeContents = document.getElementById("nav-tree-contents");
    if (!navTreeContents || expandFirstBranch()) {
      return;
    }

    const observer = new MutationObserver(function () {
      if (expandFirstBranch()) {
        observer.disconnect();
      }
    });
    observer.observe(navTreeContents, { childList: true, subtree: true });
  });

  document.addEventListener("click", function (event) {
    // Only replace an ordinary primary-button click. This preserves actions
    // such as Ctrl+click and Shift+click for opening or navigating links.
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const label = target.closest("#nav-tree .label");
    if (!label) {
      return;
    }

    // Expandable items have a direct child link containing the arrow. A leaf
    // item has no such link and therefore continues to navigate normally.
    const item = label.closest(".item");
    const expandToggle = item ? item.querySelector(":scope > a") : null;
    if (!expandToggle || !expandToggle.querySelector(".arrow")) {
      return;
    }

    // Suppress the label link and delegate to Doxygen's existing toggle so
    // its animation, arrow state, and lazy child loading remain unchanged.
    event.preventDefault();
    event.stopPropagation();
    expandToggle.click();
  }, true);
}());
