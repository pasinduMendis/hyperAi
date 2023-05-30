const hasValidFields = (req, res, next) => {
  const websiteId = req.query.websiteId
  const journeysId = req.query.journeysId
  if (!websiteId || websiteId === '' || !journeysId || journeysId === '') {
    res.status(400).send({
      message: 'journey id and Website id is mandatory',
    })
  }

  next()
}

const validateCreation = (req, res, next) => {
  const { steps, funnelMode } = req.body;

  if (!steps || steps.length === 0) {
    res.status(400).send({
      message: 'Set of steps are mandatory',
    })
  }
  if (!funnelMode || funnelMode.length == 0) {
    res.status(400).send({
      message: 'Funnel mode is mandatory',
    })
  }

  next();
}

const validateUpdate = (req, res, next) => {
  const { steps } = req.body;
  const {journeyId, websiteId} = req.params;
  
  if (!journeyId || journeyId.length === 0) {
    res.status(400).send({
      message: 'Journey id is mandatory',
    })
  }
  if (!websiteId || websiteId.length === 0) {
    res.status(400).send({
      message: 'Website id is mandatory',
    })
  }
  if (!steps || steps.length === 0) {
    res.status(400).send({
      message: 'Set of steps are mandatory',
    })
  }
  next();
}

const userJourneyValidators = {
  hasValidFields,
  validateCreation,
  validateUpdate
}

module.exports = userJourneyValidators
