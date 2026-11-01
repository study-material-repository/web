import {createTheme} from '@kyralabs/m3e-tokens/theme';
import {writeFile} from 'node:fs/promises';
const theme=createTheme({seed:'#5063a8',variant:'tonalSpot',mode:'light',motionScheme:'expressive'});
await writeFile('assets/theme.css',theme.cssText);

