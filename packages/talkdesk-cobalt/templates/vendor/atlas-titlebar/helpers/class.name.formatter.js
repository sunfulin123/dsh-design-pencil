import classnames from 'classnames'

const classNameFormatter = classNames =>
  classnames(classNames).trim() || undefined

export default classNameFormatter
