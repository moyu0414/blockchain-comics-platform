# React box

This is a react base component which will reduce considerably necessity to write css code.

## Getting Started

1. Installation

```
npm install @cronocode/react-box
```

2. Use component

Sizes is equal to `1/4rem`

`padding={3}` means `1/4 * 3 => 0.75rem`

In the example below is creating a box with `maring: 0.5rem` and `padding: 1.75rem`

```
import Box from "@cronocode/react-box";

export default function Component(props: Props) {
  return (
    <Box className="custom-class" m={2} p={7}>
      basic example
    </Box>
  );
}
```

**NOTE**: Root `font-size` is set to `16px`

## Components

- **Box** - base component with a tons of props

```
import Box from "@cronocode/react-box";
```

<br/>

### Alias-shortcuts components

- **Flex** - this is a `Box` component with `display: flex` style

```
import Flex from "@cronocode/react-box/components/flex";
```

- **Button** - this is a `Box` component with html tag `button` and `onClick` prop

```
import Button from "@cronocode/react-box/components/button";
```

- **Textbox** - this is a `Box` component with html tag `input`

```
import Textbox from "@cronocode/react-box/components/textbox";
```

- **Tooltip** - this is useful when you need a position absolute and the parent has overflow hidden.

```
import Tooltip from "@cronocode/react-box/components/tooltip";
```

## Extend props

1. It is possible to extend some props like `color`, `background`, `backgroundImage` and `shadow`

```JS
function themePlugin() {
  return {
    name: 'themePlugin',
    configResolved() {
      const result = Theme.setupAugmentedProps({
        colors: {
          primary: '#445566'
        },
        backgroundImages: {
          gradient: 'linear-gradient(to right, #77A1D3 0%, #79CBCA  51%, #77A1D3  100%)'
        },
        shadows: {
          1: '0 4px 10px rgb(224 224 224 / 52%)',
        }
      });

      fs.writeFileSync('./src/box-theme.generated.css', result.variables);
      fs.writeFileSync('./src/box.generated.d.ts', result.boxDts);
    },
  }
}

```

2. Add this plugin to your build tool

Vitejs

```JS
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [..., themePlugin()],
})
```

3. Include `box-theme.generated.css` in your root file

```JS
import './box-theme.generated.css';
```

## Theme for components

In the project root file (main.tsx) use `Theme.setup`

```JS
import Theme from '@cronocode/react-box/theme';

Theme.setup({
  button: {
    styles: {
      px: 4
    },
    themes: {
      mytheme: {
        px: 8
      }
    }
  },
  ...
})
```

All styles will be applied to Button component

```JS
import Button from '@cronocode/react-box/components/button';

function MyComponent() {
  return <Button>Click me</Button>
}
```

or is possible to use Button with specific theme

```JS
import Button from '@cronocode/react-box/components/button';

function MyComponent() {
  return <Button theme="mytheme">Click me</Button>
}
```

## Theme variables

In CSS file is possible to override default values for:

```CSS
  --borderColor: black;
  --outlineColor: black;
  --lineHeight: 1.2;
  --fontSize: 14px;
  --transitionTime: 0.25s;
```
