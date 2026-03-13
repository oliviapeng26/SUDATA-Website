# Calendar Configuration Guide

## Overview

Your events calendar now has a **comprehensive config system** that makes it easy to:
- Switch between years (2024, 2025, 2026, etc.)
- Show semester weeks automatically (S1W1, S1W2, etc.)
- Display special periods (STUVAC, Exams, Mid-Sem)
- Show public holidays
- Update once per year from USyd PDF

---

## File Structure

```
src/
├── components/
│   ├── EventCalendar.jsx        # Main calendar (uses configs)
│   └── EventModal.jsx           # Event popup
├── data/
│   ├── events.json              # Your SUDATA events
│   ├── semesterDates.js         # UPDATE THIS YEARLY
│   └── publicHolidays.js        # UPDATE THIS YEARLY (optional)
└── pages/
    └── events.astro             # Events page
```

---

## Annual Update Process

### **When USyd releases new calendar (usually November):**

1. **Download the PDF** from https://www.sydney.edu.au/students/key-dates.html
2. **Open `src/data/semesterDates.js`**
3. **Add new year's dates** (see guide below)
4. **Update `availableYears` array** in EventCalendar.jsx
5. **Done!** Calendar automatically works for new year

---

## Updating Semester Dates

### **Step 1: Open USyd Calendar PDF**

Look for these sections:
- Welcome Program
- Teaching weeks
- Census date
- Mid-semester break
- STUVAC
- Examinations

### **Step 2: Copy dates to `semesterDates.js`**

Add a new year block:

```javascript
export const SEMESTER_DATES = {
  // ... existing years ...
  
  2027: {  // New year
    semester1: {
      welcomeProgram: { start: '2027-02-XX', end: '2027-02-XX' },
      teaching: { start: '2027-02-XX', end: '2027-05-XX' },
      censusDate: '2027-03-XX',
      midSemesterBreak: { start: '2027-04-XX', end: '2027-04-XX' },
      stuvac: { start: '2027-06-XX', end: '2027-06-XX' },
      exams: { start: '2027-06-XX', end: '2027-06-XX' }
    },
    semester2: {
      welcomeProgram: { start: '2027-07-XX', end: '2027-08-XX' },
      teaching: { start: '2027-08-XX', end: '2027-11-XX' },
      censusDate: '2027-08-XX',
      midSemesterBreak: { start: '2027-09-XX', end: '2027-10-XX' },
      stuvac: { start: '2027-11-XX', end: '2027-11-XX' },
      exams: { start: '2027-11-XX', end: '2027-11-XX' }
    }
  }
};
```

### **Step 3: Update available years**

In `src/components/EventCalendar.jsx`, find:

```javascript
const availableYears = [2024, 2025, 2026]; // Add new year here
```

Change to:

```javascript
const availableYears = [2024, 2025, 2026, 2027]; // Added 2027
```

**That's it!** The calendar will automatically:
- Calculate week numbers (S1W1-13, S2W1-13)
- Show STUVAC and Exam periods
- Display Mid-Semester breaks
- Handle year switching

---

## Updating Public Holidays

### **Option 1: Automatic (Recommended)**

The calendar tries to fetch NSW public holidays from the Australian Government API automatically. **No action needed!**

### **Option 2: Manual Fallback**

If you prefer manual control or the API fails, update `src/data/publicHolidays.js`:

```javascript
export const PUBLIC_HOLIDAYS = {
  // ... existing years ...
  
  2027: [
    { date: '2027-01-01', name: "New Year's Day" },
    { date: '2027-01-26', name: 'Australia Day' },
    { date: '2027-03-26', name: 'Good Friday' },
    { date: '2027-03-27', name: 'Easter Saturday' },
    { date: '2027-03-28', name: 'Easter Sunday' },
    { date: '2027-03-29', name: 'Easter Monday' },
    { date: '2027-04-26', name: 'ANZAC Day (observed)' },
    { date: '2027-06-14', name: "King's Birthday" },
    { date: '2027-10-04', name: 'Labour Day' },
    { date: '2027-12-25', name: 'Christmas Day' },
    { date: '2027-12-27', name: 'Boxing Day (observed)' }
  ]
};
```

**Where to find holiday dates:**
- https://www.industrialrelations.nsw.gov.au/public-holidays/
- Or use the USyd PDF (they list public holidays)

---

## What Users See

### **Calendar Features:**

1. **Year Selector**
   - Buttons at top: `2024 | 2025 | 2026`
   - Click to switch years instantly

2. **Semester Week Labels**
   - Small text in corner of each day
   - Shows: `S1W3` (Semester 1, Week 3)
   - Shows: `STUVAC`, `Exams`, `Mid-Sem` during special periods

3. **Public Holidays**
   - Days highlighted in magenta/pink
   - Holiday name shown if no events that day

4. **SUDATA Events**
   - Blue event badges on calendar days
   - Click to see full details

### **Example Calendar Day:**

```
+----------------+
| 15     S1W3    | <- Day 15, Semester 1 Week 3
|                |
| Workshop       | <- SUDATA event
| ANZAC Day      | <- Public holiday
+----------------+
```

---

## Quick Reference

### **USyd PDF to Config Mapping**

| PDF Says | Config Field |
|----------|--------------|
| "Welcome Program: Feb 10-21" | `welcomeProgram: { start: '2025-02-10', end: '2025-02-21' }` |
| "Teaching weeks: Feb 24 - Jun 1" | `teaching: { start: '2025-02-24', end: '2025-06-01' }` |
| "Census date: 31 March" | `censusDate: '2025-03-31'` |
| "Mid-semester break: 21-27 April" | `midSemesterBreak: { start: '2025-04-21', end: '2025-04-27' }` |
| "Study vacation (STUVAC): 2-8 June" | `stuvac: { start: '2025-06-02', end: '2025-06-08' }` |
| "Examinations: 10-21 June" | `exams: { start: '2025-06-10', end: '2025-06-21' }` |

### **Date Format**

Always use: `YYYY-MM-DD`

Examples:
- Correct: `'2027-02-15'` (February 15, 2027)
- Correct: `'2027-11-03'` (November 3, 2027)
- Wrong: `'15/02/2027'` (Wrong format!)
- Wrong: `'2027-2-15'` (Missing zero padding!)

---

## Common Issues

### **Issue: Weeks not showing**
**Solution:** Check that semester teaching dates are correct in `semesterDates.js`

### **Issue: Wrong week numbers**
**Solution:** Verify `teaching.start` date matches USyd calendar exactly

### **Issue: Public holidays not showing**
**Solution:** 
1. Check browser console for API errors
2. If API fails, add holidays manually to `publicHolidays.js`

### **Issue: Year selector not showing new year**
**Solution:** Add the year to `availableYears` array in EventCalendar.jsx

---

## Testing Your Changes

After updating configs:

1. Run `npm run dev`
2. Navigate to `/events`
3. **Test checklist:**
   - [ ] Year selector shows new year
   - [ ] Click new year button - calendar updates
   - [ ] Navigate through months
   - [ ] Verify semester weeks appear (S1W1, S1W2, etc.)
   - [ ] Check STUVAC/Exams show correctly
   - [ ] Verify public holidays highlight in pink/magenta
   - [ ] Click an event - modal opens correctly

---

## Pro Tips

1. **Do it once per year** (November when USyd releases calendar)
2. **Keep old years** - users can browse history
3. **Test with current month** first
4. **Copy-paste dates carefully** - easy to make typos!
5. **Use Find & Replace** for bulk date updates

---

## Need Help?

If weeks aren't calculating correctly:
1. Double-check `teaching.start` date
2. Verify `midSemesterBreak` dates
3. Ensure dates are in `YYYY-MM-DD` format
4. Check browser console for errors

The system automatically handles:
- Week number calculation
- Mid-semester break gaps
- STUVAC and exam periods
- Leap years
- Month transitions

Just provide the dates and it does the rest!
