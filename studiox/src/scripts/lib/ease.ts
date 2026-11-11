import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

export const ease = {
  expo: CustomEase.create('sx-expo', '0.16,1,0.3,1'),
  swift: CustomEase.create('sx-swift', '0.87,0,0.13,1'),
  quart: CustomEase.create('sx-quart', '0.76,0,0.24,1'),
  mark: CustomEase.create('sx-mark', '0.42,0,0.58,1'),
  standard: CustomEase.create('sx-standard', '0.4,0,0.2,1'),
};
