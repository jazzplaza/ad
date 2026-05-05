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

    function keepGenealogyNodeCentered($node, opts) {
        var nodeEl = $node && $node.length ? $node.get(0) : null;
        if (!nodeEl) {
            return;
        }

        var $body = $node.closest('.genealogy-body');
        var bodyEl = $body.length ? $body.get(0) : null;
        if (!bodyEl) {
            return;
        }

        opts = opts || {};
        var mobileView = window.matchMedia && window.matchMedia('(max-width: 991.98px)').matches;
        var activeAnim = bodyEl.__genealogyCenterAnim || null;
        if (activeAnim && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(activeAnim);
            bodyEl.__genealogyCenterAnim = null;
        }

        function computeTargetScrollLeft() {
            var bodyRect = bodyEl.getBoundingClientRect();
            var nodeRect = nodeEl.getBoundingClientRect();

            var bodyCenter = bodyRect.left + bodyRect.width / 2;
            var nodeCenter = nodeRect.left + nodeRect.width / 2;
            var delta = nodeCenter - bodyCenter;

            if (!Number.isFinite(delta) || Math.abs(delta) < 1) {
                return null;
            }

            var maxScroll = Math.max(0, bodyEl.scrollWidth - bodyEl.clientWidth);
            var next = bodyEl.scrollLeft + delta;
            return Math.max(0, Math.min(maxScroll, next));
        }

        function animateScrollTo(target, duration) {
            if (target == null) {
                return;
            }

            if (!mobileView) {
                bodyEl.scrollLeft = target;
                return;
            }

            var start = bodyEl.scrollLeft;
            var delta = target - start;
            if (!Number.isFinite(delta) || Math.abs(delta) < 1) {
                bodyEl.scrollLeft = target;
                return;
            }

            duration = duration || 260;
            var startTs = null;

            function easeInOutCubic(t) {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

            function step(ts) {
                if (startTs == null) {
                    startTs = ts;
                }

                var p = Math.min(1, (ts - startTs) / duration);
                var eased = easeInOutCubic(p);
                bodyEl.scrollLeft = start + delta * eased;

                if (p < 1) {
                    bodyEl.__genealogyCenterAnim = requestAnimationFrame(step);
                } else {
                    bodyEl.__genealogyCenterAnim = null;
                }
            }

            bodyEl.__genealogyCenterAnim = requestAnimationFrame(step);
        }

        function runCentering(retriesLeft) {
            var target = computeTargetScrollLeft();
            if (target == null) {
                if (retriesLeft > 0) {
                    setTimeout(function () { runCentering(retriesLeft - 1); }, 60);
                }
                return;
            }

            animateScrollTo(target);
        }

        // Wait until slide animation settles, then center (mobile animates; desktop snaps).
        setTimeout(function () {
            requestAnimationFrame(function () {
                runCentering(8);
            });
        }, mobileView ? 220 : 0);
    }

    function showAllTreeDescendants($node) {
        $node.find('ul').each(function () {
            showTreeChildren($(this));
        });
    }

    function hideAllTreeDescendants($node) {
        $node.find('ul').each(function () {
            hideTreeChildren($(this));
        });
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

            // Support both half-width & and full-width ＆
            if (rawText.indexOf('&') === -1 && rawText.indexOf('＆') === -1) {
                return;
            }

            var parts = rawText
                .split(/[&＆]/)
                .map(function (p) { return p.trim(); })
                .filter(Boolean);

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

    $(document).on('click', '.genealogy-tree li > a', function (event) {
        var $node = $(this).closest('li');
        var $children = $node.children('ul');
        var isTopLevelNode = $node.parent('ul').parent('.genealogy-tree').length > 0;

        if (!$children.length) {
            return;
        }

        if (isTopLevelNode) {
            if ($children.is(':visible')) {
                hideAllTreeDescendants($node);
            } else {
                showAllTreeDescendants($node);
            }
        } else {
            if ($children.is(':visible')) {
                hideTreeChildren($children);
            } else {
                showTreeChildren($children);
            }
        }

        keepGenealogyNodeCentered($node);
        event.preventDefault();
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

