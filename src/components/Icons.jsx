import React from 'react';

export function SendIcon(props) {
return React.createElement(
'svg',
{ className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
})
);
}

export function ArrowLeftIcon(props) {
return React.createElement(
'svg',
{ className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M10 19l-7-7m0 0l7-7m-7 7h18',
})
);
}

export function CheckIcon(props) {
return React.createElement(
'svg',
{ className: 'w-3.5 h-3.5 text-gray-400 inline', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M5 13l4 4L19 7',
})
);
}

export function CheckCheckIcon({ color = 'text-blue-500', className = '' }) {
return React.createElement(
'svg',
{ className: 'w-3.5 h-3.5 inline ' + color + ' ' + className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M5 13l4 4L19 7M9 13l4 4L23 7',
})
);
}

export function SearchIcon(props) {
return React.createElement(
'svg',
{ className: 'w-4 h-4 text-slate-400', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
})
);
}

export function RefreshCwIcon({ spinning = false, className = '' }) {
return React.createElement(
'svg',
{ className: 'w-4 h-4 ' + (spinning ? 'animate-spin ' : '') + className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
})
);
}

export function TagIcon(props) {
return React.createElement(
'svg',
{ className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
})
);
}

export function FileTextIcon(props) {
return React.createElement(
'svg',
{ className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
})
);
}

export function CreditCardIcon(props) {
return React.createElement(
'svg',
{ className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
})
);
}

export function SettingsIcon(props) {
return React.createElement(
'svg',
{ className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
}),
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
})
);
}

export function UserIcon(props) {
return React.createElement(
'svg',
{ className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
})
);
}

export function XIcon(props) {
return React.createElement(
'svg',
{ className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M6 18L18 6M6 6l12 12',
})
);
}

export function InboxIcon(props) {
return React.createElement(
'svg',
{ className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
React.createElement('path', {
strokeLinecap: 'round',
strokeLinejoin: 'round',
strokeWidth: 2,
d: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
})
);
}