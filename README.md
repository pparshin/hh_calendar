hh_calendar
===========

Тестовое задание для Школы программистов hh.ru

Описание
===========

При разработке я использовал HTML 5 и Javascript без сторонних библиотек.

Постарался реализовать весь функционал: добавление/редактирование событий, поиск событий, навигация по календарю.

Быстрое добавление событий привязано к текущему дню.

К кнопке "Обновить" не привязано никакое действие, поскольку не совсем понял для чего она требуется.

Известные баги
===========

1. В IE при использовании ftp-протокола не работает localStorage. В других браузерах события сохраняются нормально.
2. Может неправильно срабатывать переход к нужному дню, поскольку дата не поместилась на календаре при отображении месяца. На мой взгляд, стоило сделать 6 строк в таблице, чтобы месяц выводился полностью, а не разбивался.

Автор
===========
Павел Паршин
