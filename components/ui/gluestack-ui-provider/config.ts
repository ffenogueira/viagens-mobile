import { vars } from 'nativewind';

// Raw color values - update these and they sync everywhere
export const colors = {
  light: {
    '--primary': '123 77 255',
    '--primary-foreground': '255 255 255',
    '--card': '255 255 255',
    '--card-foreground': '17 24 39',
    '--secondary': '244 239 255',
    '--secondary-foreground': '94 53 217',
    '--background': '248 250 252',
    '--popover': '255 255 255',
    '--popover-foreground': '17 24 39',
    '--muted': '241 245 249',
    '--muted-foreground': '100 116 139',
    '--destructive': '239 68 68',
    '--foreground': '17 24 39',
    '--border': '229 231 235',
    '--input': '229 231 235',
    '--ring': '123 77 255',
    '--accent': '236 254 255',
    '--accent-foreground': '14 165 233',
  },
  dark: {
    '--primary': '167 139 250',
    '--primary-foreground': '17 24 39',
    '--card': '31 41 55',
    '--card-foreground': '248 250 252',
    '--secondary': '55 48 163',
    '--secondary-foreground': '237 233 254',
    '--background': '17 24 39',
    '--popover': '31 41 55',
    '--popover-foreground': '248 250 252',
    '--muted': '55 65 81',
    '--muted-foreground': '148 163 184',
    '--destructive': '248 113 113',
    '--foreground': '248 250 252',
    '--border': '55 65 81',
    '--input': '55 65 81',
    '--accent': '14 116 144',
    '--accent-foreground': '236 254 255',
    '--ring': '167 139 250',
  },
};

// Config for nativewind vars() - used by provider
export const config = {
  light: vars(colors.light),
  dark: vars(colors.dark),
};
