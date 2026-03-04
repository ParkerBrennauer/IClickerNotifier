import './style.css';
import typescriptLogo from '@/assets/typescript.svg';
import wxtLogo from '/wxt.svg';
import { setupCounter } from '@/components/counter';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
