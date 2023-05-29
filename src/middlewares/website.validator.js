const hasValidFields = (req, res, next) => {
  const websiteId = req.body.websiteId

  if (!websiteId || websiteId === '') {
    return res.status(400).send({
      message: 'Website id is mandatory',
    })
  }

  next()
}

const hasWebsiteId = (req, res, next) => {
  const websiteId = req.params.websiteId

  if (!websiteId || websiteId === '') {
    return res.status(400).send({
      message: 'Website id is mandatory',
    })
  }

  next()
}

const websiteValidators = {
  hasValidFields,
  hasWebsiteId
}

module.exports = websiteValidators
