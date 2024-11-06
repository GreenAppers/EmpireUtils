import { MojangRule, MojangStringsTemplate } from '../constants'

export const replaceTemplateVariables = (
  input: string,
  values: Record<string, string>
) => input.replace(/\${(\w+)}/g, (match, key) => values[key] ?? match)

export const getOsArch = () => {
  switch (process.arch) {
    case 'ia32':
      return 'x86'
    default:
      return process.arch
  }
}

export const getOsName = () => {
  switch (process.platform) {
    case 'win32':
      return 'windows'
    case 'darwin':
      return 'osx'
    case 'linux':
      return 'linux'
    default:
      return process.platform
  }
}

export const allowRules = (
  context: {
    osName: string
    osArch: string
    features?: Record<string, boolean>
  },
  rules?: MojangRule[]
) => {
  let include = true
  for (const rule of rules ?? []) {
    if (rule.action === 'allow') {
      if (rule.os?.name && rule.os.name !== context.osName) {
        include = false
        break
      }
      if (rule.os?.arch && rule.os?.arch !== context.osArch) {
        include = false
        break
      }
      const features = Object.entries(rule.features ?? {})
      if (
        features?.length &&
        !features.every(([k, v]) => context.features?.[k] === v)
      ) {
        include = false
        break
      }
    }
  }
  return include
}

export const applyArgumentsTemplate = (
  context: { osName: string; osArch: string },
  template: MojangStringsTemplate,
  values: Record<string, string>,
  output: string[]
) => {
  for (const argument of template) {
    if (typeof argument === 'string') {
      output.push(replaceTemplateVariables(argument, values))
      continue
    }
    if (!allowRules(context, argument.rules)) continue
    if (typeof argument.value === 'string')
      output.push(replaceTemplateVariables(argument.value, values))
    else
      output.push(
        ...argument.value.map((x) => replaceTemplateVariables(x, values))
      )
  }
  return output
}

export const filterBlankArguments = (input: string[]) => {
  const output: string[] = []
  for (let i = 0; i < input.length; i++) {
    if (
      i < input.length - 1 &&
      input[i + 1] === '' &&
      input[i].startsWith('--')
    ) {
      i++
      continue
    }
    output.push(input[i])
  }
  return output
}
