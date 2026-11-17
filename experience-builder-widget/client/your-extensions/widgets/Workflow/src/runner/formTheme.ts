import { type IMThemeVariables } from 'jimu-core'
import { alpha, createTheme, GcxThemeProvider } from '@vertigis/react-ui/styles'
import type { Theme } from '@vertigis/react-ui/styles/createTheme'
import { createElement, type ReactNode, useSyncExternalStore } from 'react'

interface FormThemeEntry {
  source: IMThemeVariables
  theme: Theme
  listeners: Set<() => void>
}

// The current form theme for each widget, so forms that are already open follow ExB theme changes.
const formThemes = new Map<string, FormThemeEntry>()

/**
 * Sets the ExB theme for a widget's forms and dialogs, updating any that are open.
 * @param widgetId The widget id.
 * @param theme The theme ExB provides to the widget.
 */
export function setFormTheme(widgetId: string, theme: IMThemeVariables) {
  const entry = formThemes.get(widgetId)
  if (!entry) {
    formThemes.set(widgetId, { source: theme, theme: createFormTheme(theme), listeners: new Set() })
  } else if (entry.source !== theme) {
    entry.source = theme
    entry.theme = createFormTheme(theme)
    entry.listeners.forEach(listener => listener())
  }
}

function getEntry(widgetId: string): FormThemeEntry {
  let entry = formThemes.get(widgetId)
  if (!entry) {
    entry = { source: undefined, theme: createTheme(), listeners: new Set() }
    formThemes.set(widgetId, entry)
  }
  return entry
}

/**
 * Provides a widget's current form theme to its children, re-rendering them when the ExB theme changes.
 */
export function FormThemeProvider({ widgetId, children }: { widgetId: string, children?: ReactNode }) {
  const theme = useSyncExternalStore(
    listener => {
      const listeners = getEntry(widgetId).listeners
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => getEntry(widgetId).theme
  )
  return createElement(GcxThemeProvider, { theme }, children)
}

/**
 * Creates the MUI theme used by Workflow forms and dialogs from the ExB theme.
 *
 * The Workflow SDK's form components are built on MUI (via `@vertigis/react-ui`) and take their colors from the MUI
 * theme rather than from CSS, so without this they fall back to MUI's default light palette regardless of the ExB
 * theme (e.g. dark label text on a dark background).
 * @param theme The theme ExB provides to the widget.
 */
export function createFormTheme(theme: IMThemeVariables): Theme {
  const { color, typography } = theme.sys
  const mode = color.mode === 'dark' ? 'dark' : 'light'
  const schemeColor = (scheme: { light: string, main: string, dark: string, text: string }) => ({
    light: scheme.light,
    main: scheme.main,
    dark: scheme.dark,
    contrastText: scheme.text
  })

  try {
    return createTheme({
      palette: {
        mode,
        primary: schemeColor(color.primary),
        secondary: schemeColor(color.secondary),
        error: schemeColor(color.error),
        warning: schemeColor(color.warning),
        info: schemeColor(color.info),
        success: schemeColor(color.success),
        background: {
          default: color.surface.background,
          paper: color.surface.paper
        },
        text: {
          primary: color.surface.backgroundText,
          secondary: alpha(color.surface.backgroundText, 0.7),
          disabled: color.action.disabled.text
        },
        divider: color.divider.primary
      },
      typography: {
        fontFamily: typography.body.fontFamily
      }
    })
  } catch (error) {
    // MUI throws on colors it can't parse (e.g. named colors in a custom theme). Still match light/dark so text stays
    // readable.
    console.warn('Unable to apply the ExB theme colors to Workflow forms.', error)
    return createTheme({ palette: { mode } })
  }
}
