export const mlToLiters = (ml) => +(ml / 1000).toFixed(3)

export const litersToMl = (liters) => Math.round(liters * 1000)

export const calculatePrice = (ml, pricePerLiter) => {
  const liters = mlToLiters(ml)
  return +(liters * pricePerLiter).toFixed(2)
}

export const formatMl = (ml) => {
  if (ml >= 1000) return `${mlToLiters(ml)}L`
  return `${ml}ml`
}
