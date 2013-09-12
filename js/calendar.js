/**
 * Конструктор класса Calendar
 * @param parentElementId - ID элемента, в котором будет размещаться календарь
 * @constructor
 */
function Calendar(parentElementId) {
    this.parentElementId = parentElementId;
    // Текущая дата
    this.currentDate = new Date();
    // Выбранный месяц для отображения
    this.currentMonth = this.currentDate.getMonth();
    // Выбранный год для отображения
    this.currentYear = this.currentDate.getFullYear();
    // Выбранная пользователем ячейка на календаре
    this.selectedCell = null;
    // Ячейка, хранящая информацию о текущем дне
    this.cellWithCurrentDate = null;
    // Выбранная пользователем дата на календаре
    this.selectedDate = null;
    // Всплывающий слой для ввода информации о событии
    this.bubble = this.createBubble();
    // По умолчанию слой bubble скрыт. Это свойство хранит флаг видимости
    this.bubbleVisible = false;
    // Слой с предложениями при поиске события
    this.suggest = document.getElementById("ui-suggest");
    // Слой с быстрым добавлением события
    this.quickAddEvent = document.getElementById("ui-quick-add-event");
    // Массив, в котором хранятся даты, соответствующие ячейкам таблицы
    this.allDateInCells = [];
    // Загружаем все сохраненные события в массив this.allEvents
    this.loadEventsFromStorage();

    // Создаем html-разметку таблицы и загружаем календарь
    this.createTable();
    this.loadCalendar(this.currentDate.getMonth(), this.currentDate.getFullYear());
}

/**
 * Функция создает таблицу-макет для календаря
 */
Calendar.prototype.createTable = function() {
    // Родительский элемент, в который будем добавлять таблицу
    var parentElement = document.getElementById(this.parentElementId);
    // Создаем таблицу
    var calendarTable = "<table id='calendar-table'>";
    for (var row = 1; row <= 5; row++) {
        calendarTable += "<tr>";
        for (var col = 1; col <= 7; col++) {
            calendarTable += "<td id='calendar-cell-" + row + "-" + col + "'></td>";
        }
        calendarTable += "</tr>";
    }
    calendarTable += "</table>";

    // Добавляем на страницу макет календаря и всплывающий слой
    parentElement.innerHTML = calendarTable + this.bubble;
    // Назначаем this.bubble созданный элемент DOM-структуры
    // (до этого this.bubble хранил значение типа string)
    this.bubble = document.getElementById("ui-bubble");

    // Добавляем обработчики событий нужным элементам DOM-структуры
    var cells = document.getElementById("calendar-table").getElementsByTagName("td");
    for (var i = 0, cellCount = cells.length; i < cellCount; i++) {
        cells[i].addEventListener("click", this.onClickCell.bind(this), false);
    }
    // Следующий месяц
    document.getElementById("ui-button-next").addEventListener("click", this.onClickNext.bind(this), false);
    // Предыдущий месяц
    document.getElementById("ui-button-prev").addEventListener("click", this.onClickPrev.bind(this), false);
    // Переход к текущему дню на календаре
    document.getElementById("ui-button-today").addEventListener("click", this.onClickToday.bind(this), false);
    document.body.addEventListener("click", this.onClickBody.bind(this), false);
    // Кнопка Готово для добавления/редактирования события
    document.getElementById("add-calendar-event").addEventListener("click", this.onClickCreateEvent.bind(this), false);
    // Кнопка Удалить для удаления события
    document.getElementById("remove-calendar-event").addEventListener("click", this.onClickRemoveEvent.bind(this), false);
    // Закрытие формы
    document.getElementById("ui-close-form").addEventListener("click", this.onClickCloseForm.bind(this), false);
    // Поиск события
    document.getElementById("ui-search-input").addEventListener("keyup", this.onKeyUpInSearch.bind(this), false);
    // Быстрое добавление события - открытие всплывающего слоя
    document.getElementById("add-button").addEventListener("click", this.onClickQuickAddEvent.bind(this), false);
    // Быстрое добавление события
    document.getElementById("ui-quick-add-event-submit").addEventListener("click", this.onClickQuickAddEventSubmit.bind(this), false);
};

/**
 * Основная функция класса. Отвечает за загрузку текущего месяца, дат, названий дней недели, событий.
 * @param month
 * @param year
 */
Calendar.prototype.loadCalendar = function(month, year) {
    var firstDay = new Date(year, month, 1),
        firstDayColInTable = firstDay.getDayRus() + 1,
        // Счетчик дней
        dayNumber = 1,
        // Количество дней в месяце
        daysInMonth = this.getDaysInMonth(month, year),
        dateInCell, monthInCell = month, yearInCell = year;

    // Очищаем макет от содержимого перед загрузкой новых данных.
    this.clearCalendar();

    // Проходимся по таблице и заполняем ячейки содержимым
    // Для 1 строки добавляем названия дней недели
    // Обход начинается с 1 строки и firstDayColInTable колонки
    for (var row = 1; row <= 5; row++) {
        var col = (row == 1) ? firstDayColInTable : 1;
        for (col; col <= 7; col++) {
            dateInCell = {"row": row, "col": col, "day": dayNumber, "month": monthInCell, "year": yearInCell};
            this.allDateInCells.push(dateInCell);

            var calendarCell = document.getElementById("calendar-cell-" + row + "-" + col);
            if (row == 1) {
                calendarCell.innerHTML = "<span class='calendar-day-caption'>" + this.days[col-1] + ', ' + dayNumber + "</span>";
            } else {
                calendarCell.innerHTML = "<span class='calendar-day-caption'>" + dayNumber + "</span>";
            }
            // Проверяем является ли дата сегодняшней. Если да - выделяем ее
            if (this.currentDate.getDate() == dayNumber && this.currentMonth == this.currentDate.getMonth() && this.currentYear == this.currentDate.getFullYear()) {
                calendarCell.className = "calendar-current-day";
                this.cellWithCurrentDate = calendarCell;
            }
            dayNumber++;
            // При необходимости переходим на новый месяц/год
            if (dayNumber > daysInMonth) {
                dayNumber = 1;
                monthInCell++;
                if (monthInCell > 11) {
                    monthInCell = 0;
                    yearInCell++;
                }
            }
        }
    }

    // Добавляем недостающие даты для предыдущего месяца
    // Количество дней в предыдущем месяце. Делаем проверку на загрузку нового года
    var daysInPrevMonth = month > 0 ? this.getDaysInMonth(month - 1, this.currentYear) : 31;
    for (col = firstDayColInTable-1; col >= 1; col--) {
        document.getElementById("calendar-cell-1-" + col).innerHTML = "<span class='calendar-day-caption'>" + this.days[col-1] + ", " + daysInPrevMonth + "</span>";
        dateInCell = {"row": 1, "col": col, "day": daysInPrevMonth, "month": month-1, "year": yearInCell};
        this.allDateInCells.unshift(dateInCell);

        daysInPrevMonth--;
    }

    // Выводим название месяца и год
    document.getElementById("date-label").innerHTML = this.months[month] + " " + year;
    // Загружаем все события, извлеченные из localStorage
    this.loadEventsToCalendar();
};

/**
 * Очистка календаря от содержимого и стилей
 * Некоторые поля класса также обнуляем
 */
Calendar.prototype.clearCalendar = function() {
    this.selectedCell = null;
    this.allDateInCells = [];

    var cells = document.getElementById("calendar-table").getElementsByTagName("td");

    for (var i = 0, cellsCount = cells.length; i < cellsCount; i++) {
        var cell = cells[i];
        cell.innerHTML = "";
        cell.className = "";
        // Убираем старые атрибуты, если они имеются
        if (cell.hasAttribute("event-id")) { cell.removeAttribute("event-id"); }
    }
};

/**
 * Создаем разметку всплывающего слоя для ввода информации о событии
 * @returns {string}
 */
Calendar.prototype.createBubble = function() {
    return "<div id='ui-bubble'>" +
                "<div id='ui-close-form' class='ui-close-form'></div>" +
                "<div id='ui-bubble-date'></div> " +
                "<input type='text' name='event' id='ui-event-add' class='ui-textinput' placeholder='Событие'>" +
                "<input type='text' name='participant' id='ui-participant-add' class='ui-textinput' placeholder='Имена участников'>" +
                "<textarea name='description' id='ui-description-add' placeholder='Описание'></textarea>" +
                "<input id='add-calendar-event' type='submit' value='Готово' class='ui-form-submit'>" +
                "<input id='remove-calendar-event' type='submit' value='Удалить' class='ui-form-submit'>" +
            "</div>";
};

/**
 * daysInMonthR - обычный год
 * daysInMonthL - високосный год
 * @type {Array}
 */
Calendar.prototype.daysInMonthR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
Calendar.prototype.daysInMonthL = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Дни недели
 * @type {Array}
 */
Calendar.prototype.days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

/**
 * Названия месяцев
 * @type {Array}
 */
Calendar.prototype.months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

/**
 * Названия месяцев в родительном падеже
 * @type {Array}
 */
Calendar.prototype.monthsOf = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/**
 * Является ли выбранный год високосным
 * @returns {boolean} true - високосный год, false - обычный
 */
Calendar.prototype.isLeapYear = function(year) {
    return year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
};

/**
 * Определяем количество дней в месяце
 * @returns {*} число дней в месяце
 */
Calendar.prototype.getDaysInMonth = function(month, year) {
    return this.isLeapYear(year) ? this.daysInMonthL[month] : this.daysInMonthR[month];
};

/**
 * По умолчанию неделя начинается с воскресенья
 * Изменяем на понедельник.
 * @returns {number}
 */
Date.prototype.getDayRus = function() {
    return (this.getDay() == 0) ? 6 : (this.getDay() - 1);
};

/**
 * Обработчик события по клику на suggest-item
 * Загружает нужный месяц и год, открывает выбранное событие
 * @param event
 */
Calendar.prototype.eventItemClick = function(event) {
    var target = event.target, eventItem;
    // Если нажатие произошло на дочернем элементе .suggest-item, то
    // проходимся по родителям и находим элемент .suggest-item,
    // который хранит атрибут event-id
    while (target) {
        if (target.classList != null && target.classList.contains("suggest-item")) {
            eventItem = target;
            break;
        }
        target = target.parentNode;
    }
    event.stopPropagation();

    var eventObj = this.allEvents[target.getAttribute("event-id")];
    // Загружаем нужный месяц и год
    this.currentMonth = eventObj.date.month;
    this.currentYear = eventObj.date.year;
    this.loadCalendar(this.currentMonth, this.currentYear);

    // Находим выбранное событие на календаре и открываем его
    for (var i in this.allDateInCells) {
        var currentDate = this.allDateInCells[i];
        if (currentDate.month == eventObj.date.month && currentDate.day == eventObj.date.day) {
            var cell = document.getElementById("calendar-cell-" + currentDate.row + "-" + currentDate.col);
            // Запоминаем новую выделенную ячейку, добавляем обертку и bubble
            cell.classList.add("selected");
            cell.innerHTML = "<div id='selected-wrapper'>" + cell.innerHTML + "</div>";
            // Выводим на экран всплывающий слой для редактирования информации о событии
            this.showBubble(cell);

            this.selectedCell = cell;
        }
    }

    // Список найденных событий можно скрыть
    this.suggest.style.visibility = "hidden";
};

/**
 * Обработчик события при переходе к следующему месяцу
 */
Calendar.prototype.onClickNext = function() {
    // Устанавливаем новый месяц и, если необходимо, новый год
    if (this.currentMonth < 11) {
        this.currentMonth++;
    } else {
        this.currentMonth = 0;
        this.currentYear++;
    }

    this.loadCalendar(this.currentMonth, this.currentYear);
};

/**
 * Обработчик события при переходе к предыдущему месяцу
 */
Calendar.prototype.onClickPrev = function() {
    // Устанавливаем новый месяц и, если необходимо, новый год
    if (this.currentMonth > 0) {
        this.currentMonth--;
    } else {
        this.currentMonth = 11;
        this.currentYear--;
    }

    this.loadCalendar(this.currentMonth, this.currentYear);
};

/**
 * Обработчик события при переходе к текущему месяцу и дню
 */
Calendar.prototype.onClickToday = function() {
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();

    this.loadCalendar(this.currentMonth, this.currentYear);
};

/**
 * Обработчик события по нажатию на ячейку таблицы
 * @param event
 */
Calendar.prototype.onClickCell = function(event) {
    // Определяем ячейку, в которой произошло событие
    var target = event.target, td;
    while (target) {
        if (target.tagName == "TD") {
            td = target;
            break;
        }
        target = target.parentNode;
    }
    event.stopPropagation();

    if (td != null && td != this.selectedCell) {
        this.hideBubble();
        // Если до этого уже была выбрана ячейка, то удаляем selected стили и обертку
        if (this.selectedCell != null) {
            this.selectedCell.classList.remove("selected");
            this.selectedCell.innerHTML = document.getElementById("selected-wrapper").innerHTML;
        }
        // Запоминаем новую выделенную ячейку, добавляем обертку и bubble
        td.classList.add("selected");
        td.innerHTML = "<div id='selected-wrapper'>" + td.innerHTML + "</div>";
        this.selectedCell = td;

        // Выводим на экран всплывающий слой для добавления информации о событии
        this.showBubble(td);
    } else if (td == this.selectedCell) {
        // Если пользователь нажал на ту же ячейку, то удаляем стили и обертку
        this.removeSelectedStyle();
        // Скрываем всплывающий слой
        this.hideBubble();
    }
};

/**
 * Обработчик события нажатия кнопки Готово для добавления/изменения события
 */
Calendar.prototype.onClickCreateEvent = function() {
    var date = this.selectedDate,
        title = document.getElementById("ui-event-add").value,
        participants = document.getElementById("ui-participant-add").value,
        description = document.getElementById("ui-description-add").value;

    if (title == "" && participants == "" && description == "") {
        document.getElementById("ui-event-add").focus();
        return;
    }
    this.createEvent(date, title, participants, description, "normal");
    this.hideBubble();
    this.removeSelectedStyle();
};

/**
 * Обработчик события нажатия кнопки Удалить для удаления события
 */
Calendar.prototype.onClickRemoveEvent = function() {
    if (this.selectedCell.hasAttribute("event-id")) {
        this.removeEvent(this.selectedCell.getAttribute("event-id"));
        this.hideBubble();
    } else {
        document.getElementById("ui-event-add").focus();
    }
};

/**
 * Обработчик события нажатия мышкой в любом месте страницы
 * Обработчик необходим для скрытия всплывающего слоя и снятия
 * selected стилей ячейки, например, если пользователь нажмет
 * за пределами таблицы с календарем
 * @param event
 */
Calendar.prototype.onClickBody = function(event) {
    // В массив elements заносим id всех родителей элемента, на который кликнули
    var elements = [], target = event.target;
    // Проверяем флаг отображения всплывающего слоя
    if (this.bubbleVisible) {
        while (target) {
            elements.unshift(target.id);
            target = target.parentNode;
        }
        // clickInCalendar = -1, если нажатие произошло не внутри таблицы с календарем
        var clickInCalendar = elements.indexOf(String("calendar-table"));
        // clickInBubble = -1, если нажатие произошло не внутри всплывающего слоя
        var clickInBubble = elements.indexOf(String("ui-bubble"));
        if (clickInCalendar == -1 && clickInBubble == -1) {
            // Скрываем всплывающий слой
            this.hideBubble();
            // Убираем выделение с ячейки
            this.removeSelectedStyle();
        }
    }
    if (event.target.id != "ui-search-input") {
        this.suggest.style.visibility = "hidden";
    }
    if (event.target.id == "ui-close-form-qevent") {
        this.quickAddEvent.style.visibility = "hidden";
        document.getElementById("add-button").classList.remove("clicked");
        event.stopPropagation();
    }
    if (event.target.id != "add-button") {
        elements = [];
        while (target) {
            elements.unshift(target.id);
            target = target.parentNode;
        }
        if (elements.indexOf(String("ui-quick-add-event")) == -1) {
            this.quickAddEvent.style.visibility = "hidden";
            if (document.getElementById("add-button").classList.contains("clicked")) {
                document.getElementById("add-button").classList.remove("clicked");
            }
        }
    }
};

/**
 * Закрытие всплывающего слоя по нажатию на крестик
 */
Calendar.prototype.onClickCloseForm = function() {
    this.hideBubble();
    this.removeSelectedStyle();
};

/**
 * Обработчик события при поиске события
 * @param event
 */
Calendar.prototype.onKeyUpInSearch = function (event) {
    this.suggest.innerHTML = "";
    // Искомый текст
    var searchText = document.getElementById("ui-search-input").value,
        suggestItem;

    if (searchText == "") {
        this.suggest.style.visibility = "hidden";
        return;
    }

    for (var i in this.allEvents) {
        // Выполняем регистронезависимый поиск по массиву событий
        var reg = new RegExp(searchText, 'i');
        if (this.allEvents[i].title.search(reg) != -1) {
            var formatDate = this.allEvents[i].date.day + " " + this.monthsOf[this.allEvents[i].date.month];
            suggestItem = document.createElement("div");
            suggestItem.classList.add("suggest-item");
            suggestItem.setAttribute("event-id", i);
            suggestItem.innerHTML = "<div class='white-gradient'></div>" +
                                    "<div class='suggest-item-title'>" + this.allEvents[i].title + "</div>" +
                                    "<div class='suggest-item-date'>" + formatDate + "</div>";

            this.suggest.appendChild(suggestItem);

            this.suggest.innerHTML += "<div class='suggest-separator'></div>";
        }
    }
    // Если что-то нашли
    if (this.suggest.innerHTML != "") {
        // Для последнего элемента в списке скрываем нижнюю границу
        this.suggest.lastChild.style.visibility = "hidden";
        this.suggest.innerHTML += "<div id='ui-suggest-scroll'></div>";
        this.suggest.style.visibility = "visible";

        for (var j in this.suggest.childNodes) {
            suggestItem = this.suggest.childNodes[j];
            if (suggestItem.classList != null && suggestItem.classList.contains("suggest-item")) {
                suggestItem.addEventListener("click", this.eventItemClick.bind(this), false);
            }
        }
    } else {
        this.suggest.style.visibility = "hidden";
    }
};

/**
 * Обработчик события нажатия кнопки для быстрого добавления события
 * @param event
 */
Calendar.prototype.onClickQuickAddEvent = function(event) {
    this.quickAddEvent.style.visibility = "visible";
    event.target.classList.add("clicked");
};

/**
 * Быстрое создание события для текущего дня
 * @param event
 */
Calendar.prototype.onClickQuickAddEventSubmit = function(event) {
    var date = this.currentDate,
        title = document.getElementById("ui-quick-add-event-input").value;

    // Если пользователь ничего не ввел, то устанавливаем фокус на input-элемент
    if (title == "") {
        document.getElementById("ui-quick-add-event-input").focus();
        return;
    }

    // Переходим к нужному месяцу и году. Обновляем календарь
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();

    this.loadCalendar(this.currentMonth, this.currentYear);

    this.createEvent(date, title, "", "", "quick");
    this.quickAddEvent.style.visibility = "hidden";
    document.getElementById("ui-quick-add-event-input").value = "";
    document.getElementById("add-button").classList.remove("clicked");
};

/**
 * Отображаем всплывающий слой для ввода информации о событии
 * @param element
 */
Calendar.prototype.showBubble = function(element) {
    // Находим координаты левого верхнего угла ячейки, по которой нажал пользователь
    var tdPosition = this.getElementPosition(element);
    // Определяем координаты всплывающего слоя для ввода информации о событии
    var newPositionX = tdPosition.x + element.offsetWidth + 12,
        newPositionY = tdPosition.y - 18;

    this.bubble.style.visibility = "visible";
    this.bubble.style.left =  newPositionX + "px";
    this.bubble.style.top = newPositionY + "px";

    // Позиция ячейки в таблице (номер колонки и номер строки)
    var tdX = element.cellIndex + 1, tdY = element.parentNode.rowIndex + 1;

    // Получаем информацию о выбранной дате и заносим ее в заголовок
    this.selectedDate = this.getSelectedDate(tdX, tdY);
    if (this.selectedDate != 0) {
        document.getElementById("ui-bubble-date").innerHTML = this.selectedDate.getDate() + " " + this.monthsOf[this.selectedDate.getMonth()] + " " + this.selectedDate.getFullYear();
    }

    // Если в ячейку загружено событие, то получаем данные по нему и выводим их в поля для редактирования
    for (var i in this.allEvents) {
        var eventDate = new Date(this.allEvents[i].date.year, this.allEvents[i].date.month, this.allEvents[i].date.day);
        if (eventDate.getTime() == this.selectedDate.getTime()) {
            document.getElementById("ui-event-add").value = this.allEvents[i].title;
            document.getElementById("ui-participant-add").value = this.allEvents[i].participants;
            document.getElementById("ui-description-add").value = this.allEvents[i].description;
        }
    }

    this.bubbleVisible = true;
};

/**
 * Скрываем всплывающий слой и очищаем текстовые поля
 */
Calendar.prototype.hideBubble = function() {
    this.bubbleVisible = false;
    var inputs = this.bubble.getElementsByTagName("input"), i;
    for (i in inputs) {
        if (inputs[i].type != "submit") {
            inputs[i].value = "";
        }
    }
    document.getElementById("ui-description-add").value = "";
    this.bubble.style.visibility = "hidden";
};

/**
 * Функция убирает selected стили ячейки
 */
Calendar.prototype.removeSelectedStyle = function() {
    this.selectedCell.innerHTML = document.getElementById("selected-wrapper").innerHTML;
    this.selectedCell.classList.remove("selected");
    this.selectedCell = null;
};

/**
 * Получаем координаты левого верхнего угла элемента
 * @param element
 * @returns {{x: number, y: number}}
 */
Calendar.prototype.getElementPosition = function(element) {
    var posX = 0;
    var posY = 0;

    while(element != null){
        posX += element.offsetLeft;
        posY += element.offsetTop;
        element = element.offsetParent;
    }

    return {x: posX, y : posY};
};

/**
 * Получаем дату, соответствующую выбранной пользователем ячейке
 * @param tdX номер колонки в таблице
 * @param tdY номер строки в таблице
 * @returns {*}
 */
Calendar.prototype.getSelectedDate = function(tdX, tdY) {
    for (var i in this.allDateInCells) {
        var date = this.allDateInCells[i];
        if (date.col == tdX && date.row == tdY) {
            return new Date(date.year, date.month, date.day);
        }
    }
    return 0;
};

/**
 * Функция создает объект с информацией о событии,
 * заносит его в массив this.allEvents,
 * выводит информацию в ячейку,
 * сохраняет массив с событиями в localStorage.
 * @param date объект типа Date
 * @param title событие
 * @param participants участники
 * @param description описание
 * @param mode режим добавления события: quick - быстрое, normal - обычное
 */
Calendar.prototype.createEvent = function(date, title, participants, description, mode) {
    var formatDate = {year: date.getFullYear(), month: date.getMonth(), day: date.getDate()};
    var selectedWrapper;

    if (mode == "normal") {
        if (this.selectedCell.hasAttribute("event-id")) {
            this.allEvents[this.selectedCell.getAttribute("event-id")] = {date: formatDate, title: title, participants: participants, description: description};
        } else {
            // Если это новое событие, то добавляем его в конец массива
            this.allEvents.push({date: formatDate, title: title, participants: participants, description: description});
            this.selectedCell.setAttribute("event-id", String(this.allEvents.length - 1));
            this.selectedCell.classList.add("calendar-cell-with-event")
        }

        selectedWrapper = document.getElementById("selected-wrapper");
    } else if (mode == "quick") {
        if (this.cellWithCurrentDate.hasAttribute("event-id")) {
            this.allEvents[this.cellWithCurrentDate.getAttribute("event-id")] = {date: formatDate, title: title, participants: participants, description: description};
        } else {
            // Если это новое событие, то добавляем его в конец массива
            this.allEvents.push({date: formatDate, title: title, participants: participants, description: description});
            this.cellWithCurrentDate.setAttribute("event-id", String(this.allEvents.length - 1));
        }

        selectedWrapper = this.cellWithCurrentDate;
    }

    this.insertEventInfo(selectedWrapper, title, participants, description);
    this.saveEventToStorage();
};

/**
 * Функция вставляет в container информацию о событии в html-формате
 * @param container родительский элемент, в который вставляем информацию
 * @param title событие
 * @param participants участники
 * @param description описание
 */
Calendar.prototype.insertEventInfo = function(container, title, participants, description) {
    var eventElement = document.createElement("div");
    eventElement.classList.add("calendar-event");

    eventElement.innerHTML = "<p class='event-title'>" + title + "</p>" +
                             "<p class='event-participants'>" + participants + "</p>" +
                             "<p class='event-description'>" + description + "</p>";

    // Если в container уже было событие, то заменяем его
    if (container.childNodes.length > 1) {
        container.replaceChild(eventElement, container.lastChild);
    } else {
        container.appendChild(eventElement);
    }
};

/**
 * Сохранение события в localStorage
 */
Calendar.prototype.saveEventToStorage = function() {
    if (typeof(window.localStorage) == "undefined") return;

    if (this.allEvents.length == 0) localStorage.removeItem("hh_calendar_events");
    localStorage.setItem("hh_calendar_events", JSON.stringify(this.allEvents));
};

/**
 * Загрузка события из localStorage
 */
Calendar.prototype.loadEventsFromStorage = function() {
    if (typeof(window.localStorage) !== "undefined") {
        this.allEvents = JSON.parse(localStorage.getItem("hh_calendar_events"));
        if (this.allEvents == null || this.allEvents.length == 0) this.allEvents = [];
    } else {
        this.allEvents = [];
    }
};

/**
 * Проходимся по календарю и загружаем события
 */
Calendar.prototype.loadEventsToCalendar = function() {
    if (this.allEvents == null || this.allEvents.length == 0) return;

    for (var i in this.allDateInCells) {
        var currentDate = this.allDateInCells[i];
        for (var j in this.allEvents) {
            var eventDate = this.allEvents[j].date;
            if (currentDate.year == eventDate.year && currentDate.month == eventDate.month && currentDate.day == eventDate.day) {
                var cell = document.getElementById("calendar-cell-" + currentDate.row + "-" + currentDate.col);
                this.insertEventInfo(cell, this.allEvents[j].title, this.allEvents[j].participants, this.allEvents[j].description);
                if (cell != this.cellWithCurrentDate) {
                    cell.classList.add("calendar-cell-with-event");
                }
                cell.setAttribute("event-id", j);
            }
        }
    }
};

/**
 * Удаление события из массива и localStorage
 * @param eventID
 */
Calendar.prototype.removeEvent = function(eventID) {
    // Удаляем из массива событие
    this.allEvents.splice(eventID, 1);
    // Сохраняем измененный массив в localStorage
    this.saveEventToStorage();
    // Перестраиваем календарь, поскольку изменились id событий
    this.loadCalendar(this.currentMonth, this.currentYear);
};