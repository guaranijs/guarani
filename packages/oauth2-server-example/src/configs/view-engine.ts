import { Express } from 'express'
import hbs from 'hbs'
import layouts from 'handlebars-layouts'
import path from 'path'

export function configureViews(app: Express): void {
  app.set('views', path.join(__dirname, '..', 'views'))
  app.set('view engine', 'hbs')

  // @ts-ignore
  hbs.registerHelper(layouts(hbs.handlebars))
  hbs.registerHelper('json', data => JSON.stringify(data))
  hbs.registerHelper('optional', data => data ?? '--')

  hbs.registerHelper('localdate', (date: Date) =>
    date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  )

  hbs.registerHelper('isodate', (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date)
    }

    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()

    return `${year}-${month < 10 ? '0' : ''}${month}-${day}`
  })

  hbs.registerPartials(path.join(__dirname, '..', 'views', 'partials'))
}
