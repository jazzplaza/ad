$(function () {
    var $infoModal = $('#genealogy-info-modal');
    var $infoTrigger = $('#genealogy-info-trigger');

    function initGenealogyTree($tree) {
        $tree.find('ul').hide();
        $tree.children('ul').show();
        $tree.find('ul.active').hide();
    }

    function syncMaternalTree() {
        var $paternalBody = $('#genealogy-panel-paternal .genealogy-body').first();
        var $maternalPanel = $('#genealogy-panel-maternal');

        if (!$paternalBody.length || !$maternalPanel.length) {
            return;
        }

        $maternalPanel.empty().append($paternalBody.clone());
        initGenealogyTree($maternalPanel.find('.genealogy-tree'));
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

    $('.genealogy-tree').each(function () {
        initGenealogyTree($(this));
    });

    syncMaternalTree();

    $(document).on('click', '.genealogy-tree li', function (event) {
        var $children = $(this).children('ul');

        if (!$children.length) {
            return;
        }

        $children.stop(true, true).slideToggle('fast').toggleClass('active');
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
