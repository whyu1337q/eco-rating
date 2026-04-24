# Eco Rating

`Eco Rating` — кроссплатформенное приложение для учёта экологической активности: регистрация по номеру телефона, фиксация сдачи вторсырья, личная статистика и общий рейтинг участников.

Проект использует один веб-интерфейс из папки `app/`, который запускается как:

- Electron-приложение на Windows и Linux;
- Android-приложение через Capacitor;
- клиент к Supabase для хранения профилей, операций и live-обновлений.

## Возможности

- регистрация и повторный вход по номеру телефона;
- выбор страны по телефонному префиксу и флагу;
- создание профиля участника с именем;
- ввод фракции вторсырья, веса и комментария;
- личная статистика и история последних операций;
- общий рейтинг пользователей без показа номера телефона;
- фильтрация рейтинга по фракции и сортировка;
- синхронизация данных через Supabase Realtime;
- переключение темы: системная, светлая, тёмная.

## Технологии

- `Electron`
- `Capacitor`
- `Supabase`
- нативный `HTML`, `CSS`, `JavaScript`

## Быстрый старт

Установите зависимости:

```bash
npm install
```

Создайте локальный конфиг Supabase на основе шаблона:

```powershell
Copy-Item .\app\supabase-config.example.txt .\app\supabase-config.txt
```

Заполните в `app/supabase-config.txt` значения:

```txt
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Примените SQL-схему из файла `supabase-schema.sql` в `SQL Editor` вашего проекта Supabase.

После этого запустите desktop-версию:

```bash
npm start
```

Если PowerShell блокирует `npm`, используйте:

```powershell
npm.cmd install
npm.cmd start
```

## Настройка Supabase

1. Создайте проект в Supabase.
2. Откройте `SQL Editor`.
3. Выполните содержимое `supabase-schema.sql`.
4. Скопируйте `app/supabase-config.example.txt` в `app/supabase-config.txt`.
5. Подставьте ваш `SUPABASE_URL` и `SUPABASE_ANON_KEY`.

Важно: файл `app/supabase-config.txt` считается локальным конфигом и не должен попадать в публичный репозиторий.

## Сборка desktop

```bash
npm run dist:win
npm run dist:linux
```

Готовые сборки появятся в папке `release`.

Для Linux-пакетов:

```bash
npm run dist:linux:packages
```

## Android

Для Android используется Capacitor, который упаковывает интерфейс из папки `app` в нативный Android-проект.

Синхронизация ресурсов:

```bash
npm run android:sync
```

Открыть проект в Android Studio:

```bash
npm run android:open
```

Сборка debug APK через Gradle:

```powershell
.\android\gradlew.bat assembleDebug
```

Обычно APK появляется по пути:

`android\app\build\outputs\apk\debug\app-debug.apk`

## Структура проекта

- `app/` — веб-интерфейс приложения;
- `electron/` — desktop-обвязка для Electron;
- `android/` — Android-проект Capacitor;
- `scripts/` — служебные скрипты проекта;
- `supabase-schema.sql` — SQL-схема базы данных;
- `icon.ico` — иконка desktop-сборки.

## Лицензия

Проект распространяется по лицензии `MIT`.
