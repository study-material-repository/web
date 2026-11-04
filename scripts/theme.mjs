import {createTheme} from '@kyralabs/m3e-tokens/theme';
import {writeFile} from 'node:fs/promises';
const theme=createTheme({seed:'#5063a8',variant:'tonalSpot',mode:'light',motionScheme:'expressive'});
await writeFile('assets/theme.css',theme.cssText + `
:root {
  /* SMR semantic accents: green for topics, warm gold for funded rewards. */
  --m3e-sys-color-tertiary: #146c4d;
  --m3e-sys-color-on-tertiary: #ffffff;
  --m3e-sys-color-tertiary-container: #d7f3e3;
  --m3e-sys-color-on-tertiary-container: #073b28;
}
`);

