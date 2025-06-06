// This file is used to declare modules for Vue components in TypeScript.
// It allows TypeScript to understand `.vue` files and their types.
// This is necessary for Vue 3 projects using TypeScript.
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, never>;
  export default component;
}