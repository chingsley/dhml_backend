export const color = {
  white: '\x1b[0m',
  black: '\u001b[30m',
  red: '\x1b[0m\x1b[31m',
  green: '\u001b[32m',
  darkgreen: '\x1b[0m\x1b[32m',
  lightgreen: '\x1b[1m\x1b[5m',
  yellow: '\u001b[33m',
  blue: '\u001b[36m',
  magenta: '\u001b[35m',
  brightGreen: '\u001b[36m',
  brightBlack: '\u001b[30;1m',
  resetColor: '\u001b[0m',
};

const { darkgreen, blue, resetColor } = color;

export const log = (...args) => {
  const { log: _log } = console;
  const _args = args.map((arg) =>
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  );
  _log('\n', darkgreen, '---@', blue, ..._args, darkgreen, '@---', resetColor);
};
