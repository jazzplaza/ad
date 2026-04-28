$(function () {
    var $infoModal = $('#genealogy-info-modal');
    var $infoTrigger = $('#genealogy-info-trigger');

    function cloneTemplate(templateId) {
        var template = document.getElementById(templateId);
        if (!template || !('content' in template)) {
            return null;
        }

        return $(template.content.cloneNode(true));
    }

    function initGenealogyTree($tree) {
        $tree.find('ul').hide();
        $tree.children('ul').show();
        $tree.find('ul.active').hide();
    }

    function centerGenealogyBody($body) {
        var el = $body && $body.length ? $body.get(0) : null;
        if (!el) {
            return;
        }

        requestAnimationFrame(function () {
            var maxScrollLeft = el.scrollWidth - el.clientWidth;
            if (maxScrollLeft <= 0) {
                return;
            }

            el.scrollLeft = Math.max(0, Math.floor(maxScrollLeft / 2));
        });
    }

    function showTreeChildren($children) {
        $children
            .stop(true, true)
            .slideDown('fast', function () {
                $(this).css('display', 'flex');
            })
            .addClass('active');
    }

    function hideTreeChildren($children) {
        $children
            .stop(true, true)
            .slideUp('fast')
            .removeClass('active');
    }

    function ensureGenealogyTreeContent($content) {
        if (!$content || !$content.length) {
            return null;
        }

        if (!$content.find('.genealogy-tree').length) {
            return null;
        }

        return $content;
    }

    function formatAncestorCouples($root) {
        $root.find('.member-details h3').each(function () {
            var $title = $(this);
            var rawText = $title.text().trim();

            if (!rawText) {
                return;
            }

            if (rawText.indexOf('&') === -1 && rawText.indexOf('＆') === -1) {
                return;
            }

            var parts = rawText.split(/[&＆]/).map(function (p) { return p.trim(); }).filter(Boolean);
            if (parts.length !== 2) {
                return;
            }

            $title
                .addClass('ancestor-pair')
                .empty()
                .append($('<span/>', { 'class': 'ancestor-vertical-name', text: parts[0] }))
                .append($('<span/>', { 'class': 'ancestor-vertical-name', text: parts[1] }));
        });
    }

    function renderFamilyTree() {
        var $panel = $('#genealogy-panel-paternal');
        var $content = ensureGenealogyTreeContent(cloneTemplate('genealogy-tree-family-template'));

        if (!$panel.length || !$content) {
            return;
        }

        $panel.empty().append($content);
        initGenealogyTree($panel.find('.genealogy-tree').first());
        centerGenealogyBody($panel.find('.genealogy-body').first());
    }

    function renderAncestorTree() {
        var $panel = $('#genealogy-panel-maternal');
        var $content = ensureGenealogyTreeContent(cloneTemplate('genealogy-tree-ancestor-template'));

        if (!$panel.length || !$content) {
            return;
        }

        $content.find('img').remove();
        $content.find('.genealogy-tree').addClass('genealogy-tree--ancestor');
        formatAncestorCouples($content);

        $panel.empty().append($content);
        initGenealogyTree($panel.find('.genealogy-tree').first());
        centerGenealogyBody($panel.find('.genealogy-body').first());
    }

    function setGenealogyPanel(panelName) {
        $('[data-genealogy-tab]').each(function () {
            var isActive = $(this).data('genealogyTab') === panelName;
            $(this).toggleClass('is-active', isActive).attr('aria-selected', String(isActive));
        });

        $('[data-genealogy-panel]').each(function () {
            var isActive = $(this).data('genealogyPanel') === panelName;
            $(this).toggleClass('is-active', isActive).prop('hidden', !isActive);
        });
    }

    function openInfoModal() {
        $infoModal.prop('hidden', false);
        $infoTrigger.attr('aria-expanded', 'true');
    }

    function closeInfoModal() {
        $infoModal.prop('hidden', true);
        $infoTrigger.attr('aria-expanded', 'false');
    }

    renderFamilyTree();
    renderAncestorTree();

    $(document).on('click', '.genealogy-tree li', function (event) {
        var $children = $(this).children('ul');

        if (!$children.length) {
            return;
        }

        if ($children.is(':visible')) {
            hideTreeChildren($children);
        } else {
            showTreeChildren($children);
        }

        event.stopPropagation();
    });

    $('[data-genealogy-tab]').on('click', function () {
        setGenealogyPanel($(this).data('genealogyTab'));
    });

    $infoTrigger.on('click', function () {
        openInfoModal();
    });

    $infoModal.on('click', '[data-modal-close="true"]', function () {
        closeInfoModal();
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape' && !$infoModal.prop('hidden')) {
            closeInfoModal();
        }
    });
});
