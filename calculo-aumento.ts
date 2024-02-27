
import yargs from 'yargs';

const args = yargs(process.argv.slice(2))
	.options({
		salario: { type: 'number' },
		aumento: { type: 'number' },
		percentualAumento: { type: 'number' },
		tabelaIR: { type: 'string', default: '2023', choices: ['2015', '2023'] },
	}).argv as { salario: number, aumento: number, percentualAumento?: number, tabelaIR: string }

const FAIXAS_INSS = [
	{
		de: 0,
		ate: 1320,
		taxa: 0.075
	},
	{
		de: 1320.01,
		ate: 2571.29,
		taxa: 0.09
	},
	{
		de: 2571.30,
		ate: 3856.94,
		taxa: 0.12
	},
	{
		de: 3856.95,
		ate: 7507.49,
		taxa: 0.14
	},
	{
		de: 7507.49,
		ate: Infinity,
		taxa: 0.14
	}
]

const FAIXAS_IRRF_2023 = [
	{
		de: 0,
		ate: 2112.00,
		taxa: 0
	},
	{
		de: 2112.01,
		ate: 2826.65,
		taxa: 0.075
	},
	{
		de: 2826.66,
		ate: 3751.05,
		taxa: 0.15
	},
	{
		de: 3751.06,
		ate: 4664.68,
		taxa: 0.225
	},
	{
		de: 4664.69,
		ate: Infinity,
		taxa: 0.275
	}
]

const FAIXAS_IRRF_2015 = [
	{
		de: 0,
		ate: 1903.98,
		taxa: 0
	},
	{
		de: 1903.99,
		ate: 2826.65,
		taxa: 0.075
	},
	{
		de: 2826.66,
		ate: 3751.05,
		taxa: 0.15
	},
	{
		de: 3751.06,
		ate: 4664.68,
		taxa: 0.225
	},
	{
		de: 4664.69,
		ate: Infinity,
		taxa: 0.275
	}
]

let { salario, aumento, tabelaIR, percentualAumento } = args


const calculaValoresFaixasAnteriores = (faixas: Array<any>, limit: number) => {

	let outrasFaixas = 0

	for (let index = 0; index < limit; index++) {
		outrasFaixas += (faixas[index].ate - faixas[index].de) * faixas[index].taxa
	}

	return outrasFaixas
}

const calculaDescontoImposto = (faixas: Array<any>, salario: number) => {
	const index = faixas.findIndex(f => salario >= f.de && salario <= f.ate)

	if (!index) {
		process.exit()
	}

	const diffSalarioINSS = Math.abs(salario - faixas[index].de)

	return calculaValoresFaixasAnteriores(faixas, index) + faixas[index].taxa * diffSalarioINSS
}

const calculaSalarioLiquido = (salario: number) => {

	const descontoINSS = calculaDescontoImposto(FAIXAS_INSS, salario)

	const salarioMenosINSS = salario - descontoINSS

	const descontoIRRF = calculaDescontoImposto(tabelaIR === '2023' ? FAIXAS_IRRF_2023 : FAIXAS_IRRF_2015, salarioMenosINSS)

	return { salario, descontoINSS, descontoIRRF, salarioMenosINSS, liquido: salarioMenosINSS - descontoIRRF }
}
const salarioComAumento = percentualAumento !== undefined ? salario + salario * (percentualAumento / 100) : salario + aumento ?? 0

const antigo = calculaSalarioLiquido(salario)
const novo = calculaSalarioLiquido(salarioComAumento)

console.log(`Salário novo Bruto R$${salarioComAumento} (aumento de R$${salarioComAumento - salario})`)
console.log(`Desconto INSS ${novo.descontoINSS}`)
console.log(`Desconto IR ${novo.descontoIRRF}`)
console.log(`Salário liquido novo ${novo.liquido}`)
console.log(`Diferença real: R$${novo.liquido - antigo.liquido}`)


