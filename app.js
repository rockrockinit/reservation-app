/**
 * The Main Application
 *
 * @created 2015-08-01
 * @author Ed Rodriguez
 */
var App = {
    /**
     * The schema data
     */
    _data: {
        page: 0,
        items: [],
        tmpls: {}
    },
    
    /**
     * The live data
     */
    data: {},
    
    highlight: 0,
    timeout: 0,
    
    /**
     * Initializes the app on page loads
     */
    init: function(){
        // SESSION DATA
        var data = localStorage.getItem('data');
        data = (/^\{/.test(data)) ? JSON.parse(data) : '';
        App.data = data || App._data;
        
        // SETUP TEMPLATES
        App.tmpl();
        
        // EVENT BINDINGS
        $('nav > button').on('click', App.showPage);
        $('.btn-add').on('click', App.add);
        $('.btn-remove-all').on('click', App.removeAll);
        $('.items').on('click', '.btn-remove', App.remove);
        $('.pane').on('keydown', '.number', function(e){
            return (e.keyCode && [37,39,8,9,48,49,50,51,52,53,54,55,56,57].indexOf(e.keyCode) > -1);
        });
        $('.btn-reset').on('click', function(){
            if(confirm('Resetting the application!!!')){
                App.reset();
            }
        });
        
        $('.items').on('mousedown focus', 'select, [contenteditable]', function(){
            $(this).closest('tr').addClass('editable');
        }).on('blur change', 'select, [contenteditable]', function(){
            $(this).closest('tr').removeClass('editable');
        }).on('keydown', '[contenteditable]', function(e){
            if(e.keyCode && e.keyCode === 13){
                return false;
            }
            return true;
        }).on('keyup change', 'select, [contenteditable]', App.update);
        
        // MISC SETUP
        $("#dtBox").DateTimePicker({
            dateFormat: "yyyy-MM-dd",
            timeFormat: "hh:mm AA",
            dateTimeFormat: "yyyy-MM-dd hh:mm:ss AA"
        });
        $('nav > button:eq('+App.data.page+')').trigger('click');
    },
    
    /**
     * Setter and Getter for template management
     *
     * @param string [name] An optional template name
     * @return string The template when used as a getter
     */
    tmpl: function(name){
        // SETTER
        if(!name){
            var $tmpls = $('[data-tmpl]');
            $tmpls.each(function(index, item){
                var $tmpl = $(item),
                    name = $tmpl.data('tmpl');
                
                $tmpl.removeAttr('data-tmpl');
                App.data.tmpls[name] = $tmpl.outerHTML();
                $tmpl.remove();
            });
            App.save();
        
        // GETTER
        }else if(App.data.tmpls[name]){
            return App.data.tmpls[name];
        }
        
        return '';
    },
    
    /**
     * Shows the page on click
     * Note: This is a DOM binded event method
     *
     * @param object e The event object
     */
    showPage: function(e){
        var $btn = $(this),
            num = $btn.index();
        
        $('nav button').removeClass('active');
        $btn.addClass('active');
        $('.panes .pane').hide();
        $('.panes .pane:eq('+num+')').show();
        
        if(num === 0){
            App.date();
        }else if(num === 1){
            App.show();
        }
        
        App.data.page = num;
        App.save();
    },
    
    /**
     * Sets the date and time input fields to the current time
     */
    date: function(){
        // TESTING: new Date(2015, 7, 2, 12, 20)
        var d = new Date(),
            year = d.getFullYear(),
            month = (d.getMonth()+1),
            day = d.getDate(),
            hour = d.getHours(),
            minutes = d.getMinutes(),
            meridiem = (hour >= 12) ? 'PM' : 'AM';
        
        // PADDING & FIXES
        hour = (hour > 12) ? (hour - 12) : hour;
        hour = (hour === 0) ? 12 : hour;
        hour = (hour < 10) ? '0'+hour : hour;
        minutes = (minutes < 10) ? '0'+minutes : minutes;
        month = (month < 10) ? '0'+month : month;
        day = (day < 10) ? '0'+day : day;

        $('#date').val(year+'-'+month+'-'+day);
        $('#time').val(hour+':'+minutes+' '+meridiem);
    },
    
    /**
     * Saves the session data
     *
     * @return boolean True if the session parsed correctly
     */
    save: function(){
        localStorage.setItem('data', JSON.stringify(App.data));
        return true;
    },
    
    /**
     * Resets the session data
     */
    reset: function(){
        App.data = App._data;
        App.save();
        location.href = location.href;
    },
    
    /**
     * Updates the editable reservation to the session data
     * Note: This is a DOM binded event method
     *
     * @param object e The Event object
     */
    update: function(e){
        clearTimeout(App.timeout);
        var $tr = $(this).closest('tr'),
            index = $tr.index(),
            fields = $('[contenteditable]', $tr),
            obj = Object.create(App.data.items[index]),
            props = ['date', 'time', 'name', 'count'],
            tag = e.target.tagName,
            seconds = (/div/i.test(tag)) ? 1500 : 1;
        
        fields.each(function(i, field){
            obj[props[i]] = $(field).text();
        });
        
        obj.status = $('select[name="status"]', $tr).val();
        
        $tr.removeClass('open filled canceled');
        $tr.addClass(obj.status.toLowerCase());
        
        
        App.timeout = setTimeout(function(){
            console.log('VALIDATING...');
            
            var errors = App.validate(obj);

            if(errors.length){
                // HANDLES EMPIES
                fields.each(function(i, field){
                    if($(field).text() === ''){
                        $(field).text(App.data.items[index][props[i]]);
                    }
                });
            }else{
                App.data.items[index] = obj;
                console.log('UPDATING...');
                App.save();
            }
        }, seconds);
    },
    
    /**
     * Validates the item before saving
     *
     * @param objectitem The item to validate
     * @return array The errors array
     */
    validate: function(item){
        var errors = [];
        if(!item.date){
            errors.push('The date is invalid');
        }
        
        if(!item.time){
            errors.push('The time is invalid');
        }
        
        if(!item.name){
            errors.push('The party\'s name is invalid');
        }
        
        if(!item.count || !/^\d+$/.test(item.count)){
            errors.push('The party\'s count is invalid');
        }
        return errors;
    },
    
    /**
     * Adds a reservation to the session data
     * Note: This is a DOM binded event method
     *
     * @param object e The Event object
     */
    add: function(e){
        var $btn = $(this),
            $form = $btn.closest('form'),
            item = $form.serializeObject(),
            errors = App.validate(item);
        
        if(errors.length){
            alert('Errors:\n\n- '+errors.join('\n- '));
        }else{
            item.status = 'Open';
            App.data.items.unshift(item);
            if(App.save()){
                $($form)[0].reset();
                App.date();
                App.highlight = 1;
                $('nav > button:eq(1)').trigger('click');
            }
        }
    },
    
    /**
     * Removes a reservation from the session data
     * Note: This is a DOM binded event method
     *
     * @param object e The Event object
     */
    remove: function(e){
        var $item = $(this),
            $tr = $item.closest('tr');
        
        App.data.items.splice($tr.index(), 1);
        $tr.fadeOut('normal', function(){
            App.save();
            App.show();
        });
    },
    
    /**
     * Removes all reservations from the session data
     */
    removeAll: function(){
        if(confirm('Removing all reservations!!!')){
            App.data.items = [];
            App.save();
            App.show();
        }
    },
    
    /**
     * Shows all reservarions
     */
    show: function(){
        var $items = $('.items tbody'),
            items = App.data.items,
            tmpl = App.tmpl('item');
        
        $items.html('');
        
        if(items.length){
            $('.btn-remove-all').show();
            items.forEach(function(item, index){
                var row = tmpl;
                
                for(var prop in item){
                    var regexp = new RegExp('\{\{'+prop+'\}\}', 'gi');
                    row = row.replace(regexp, item[prop]);
                }
                
                $row = $(row);
                $items.append($row);
                
                // SET STATUS
                $row.addClass(item.status.toLowerCase());
                $('option[value="'+item.status+'"]', $row).prop('selected', true);
            });
        }else{
            var html = App.tmpl('no-items');
            $('.btn-remove-all').hide();
            $items.html(html);
        }
        
        if(App.highlight){
            App.highlight = 0;
            $('tr:first', $items).hide();
            $('tr:first', $items).fadeIn();
        }

        $('tr:even', $items).addClass('even');
    }
};

$(function(){
    App.init();
});