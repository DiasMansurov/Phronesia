"use client";

import { useMemo, useState } from "react";

import { INVESTMENT_ASSETS, formatUsd } from "@/lib/investment-challenge";

type OptionType = "call" | "put";

const contractMultiplier = 100;
const portfolioValue = 100_000;
const optionsBudgetLimit = portfolioValue * 0.1;

function erf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  return sign * y;
}

function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.sqrt(2)));
}

function estimatePremium(type: OptionType, spot: number, strike: number, days: number) {
  const volatility = 0.35;
  const rate = 0.04;
  const time = Math.max(days, 1) / 365;
  const d1 = (Math.log(spot / strike) + (rate + (volatility ** 2) / 2) * time) / (volatility * Math.sqrt(time));
  const d2 = d1 - volatility * Math.sqrt(time);
  const call = spot * normalCdf(d1) - strike * Math.exp(-rate * time) * normalCdf(d2);
  const put = strike * Math.exp(-rate * time) * normalCdf(-d2) - spot * normalCdf(-d1);
  return Math.max(0.25, type === "call" ? call : put);
}

function isoDaysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function OptionsSimulator() {
  const [symbol, setSymbol] = useState("SPY");
  const [optionType, setOptionType] = useState<OptionType>("call");
  const [strike, setStrike] = useState(540);
  const [expiration, setExpiration] = useState(isoDaysFromNow(45));
  const [quantity, setQuantity] = useState(1);

  const asset = INVESTMENT_ASSETS.find((item) => item.symbol === symbol) ?? INVESTMENT_ASSETS[0];
  const spot = asset.referencePrice;
  const daysToExpiration = Math.max(
    1,
    Math.ceil((new Date(`${expiration}T16:00:00`).getTime() - Date.now()) / 86_400_000)
  );
  const premium = estimatePremium(optionType, spot, Math.max(1, strike), daysToExpiration);
  const totalPremium = premium * contractMultiplier * Math.max(1, quantity);
  const breakeven = optionType === "call" ? strike + premium : strike - premium;
  const budgetOk = totalPremium <= optionsBudgetLimit;

  const payoffPoints = useMemo(() => {
    const low = spot * 0.7;
    const high = spot * 1.3;
    return Array.from({ length: 9 }, (_, index) => {
      const underlying = low + ((high - low) / 8) * index;
      const intrinsic = optionType === "call" ? Math.max(0, underlying - strike) : Math.max(0, strike - underlying);
      const profit = (intrinsic - premium) * contractMultiplier * Math.max(1, quantity);
      return { underlying, profit };
    });
  }, [optionType, premium, quantity, spot, strike]);

  const minProfit = Math.min(...payoffPoints.map((point) => point.profit), 0);
  const maxProfit = Math.max(...payoffPoints.map((point) => point.profit), 1);

  return (
    <div className="options-simulator stack-xl">
      <section className="options-hero panel">
        <div className="stack-sm">
          <p className="eyebrow">Options Education Module</p>
          <h1>Learn calls and puts without leverage or real-money risk.</h1>
          <p>
            This simulator is buy-only, virtual-only, and designed for education. Options are shown in educational
            mode using simplified estimates. Real options market data is not used. This is not financial advice.
          </p>
        </div>
        <div className="options-risk-card">
          <span>Safety rules</span>
          <strong>No uncovered selling. No margin. Max 10% options exposure.</strong>
          <p>Options can expire worthless. Beginners should understand max loss before using leverage.</p>
        </div>
      </section>

      <section className="options-grid">
        <form className="panel stack-md options-ticket">
          <div className="section-header">
            <div>
              <p className="eyebrow">Mode 1</p>
              <h2>Learn Options Simulator</h2>
            </div>
            <span className="pill">Educational estimate</span>
          </div>

          <label className="form-field">
            <span>Underlying stock or ETF</span>
            <select value={symbol} onChange={(event) => {
              const next = event.target.value;
              const nextAsset = INVESTMENT_ASSETS.find((item) => item.symbol === next) ?? asset;
              setSymbol(next);
              setStrike(Math.round(nextAsset.referencePrice));
            }}>
              {INVESTMENT_ASSETS.map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.symbol} - {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="trade-side-toggle" aria-label="Option type">
            <button type="button" className={optionType === "call" ? "selected" : ""} onClick={() => setOptionType("call")}>
              Buy Call
            </button>
            <button type="button" className={optionType === "put" ? "selected" : ""} onClick={() => setOptionType("put")}>
              Buy Put
            </button>
          </div>

          <div className="options-input-grid">
            <label className="form-field">
              <span>Strike price</span>
              <input type="number" min={1} step={1} value={strike} onChange={(event) => setStrike(Number(event.target.value))} />
            </label>
            <label className="form-field">
              <span>Expiration</span>
              <input type="date" value={expiration} onChange={(event) => setExpiration(event.target.value)} />
            </label>
            <label className="form-field">
              <span>Contracts</span>
              <input type="number" min={1} step={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </label>
          </div>

          <div className="options-metrics">
            <div><span>Estimated premium</span><strong>{formatUsd(premium)}</strong></div>
            <div><span>Total premium</span><strong>{formatUsd(totalPremium)}</strong></div>
            <div><span>Breakeven</span><strong>{formatUsd(breakeven)}</strong></div>
            <div><span>Max loss</span><strong>{formatUsd(totalPremium)}</strong></div>
          </div>

          {!budgetOk ? (
            <p className="market-closed-note">This order exceeds the 10% options budget limit. Reduce quantity or choose a lower premium contract.</p>
          ) : (
            <p className="option-safe-note">Virtual buy-only order preview. Max loss is limited to the premium paid.</p>
          )}
        </form>

        <article className="panel stack-md">
          <div className="section-header">
            <div>
              <p className="eyebrow">Payoff at expiration</p>
              <h2>{symbol} {optionType.toUpperCase()} payoff preview</h2>
            </div>
          </div>
          <div className="payoff-chart" aria-label="Options payoff chart">
            {payoffPoints.map((point) => {
              const range = maxProfit - minProfit || 1;
              const height = Math.max(4, Math.abs(point.profit / range) * 160);
              return (
                <div className="payoff-bar-wrap" key={point.underlying.toFixed(2)}>
                  <span>{formatUsd(point.profit)}</span>
                  <div
                    className={point.profit >= 0 ? "payoff-bar positive" : "payoff-bar negative"}
                    style={{ height: `${height}px` }}
                  />
                  <small>{formatUsd(point.underlying)}</small>
                </div>
              );
            })}
          </div>
          <p className="muted">
            A {optionType} option becomes valuable when the underlying moves beyond the strike enough to cover the
            premium. If it does not, the contract can lose some or all of the premium.
          </p>
        </article>
      </section>

      <section className="options-grid">
        <article className="panel stack-md">
          <p className="eyebrow">Mode 2</p>
          <h2>Educational options mode.</h2>
          <p className="muted">
            Options are shown in educational mode using simplified estimates. Real options market data is not used, and
            this page does not display real options quotes.
          </p>
        </article>
        <article className="panel stack-md">
          <p className="eyebrow">Open option positions</p>
          <h2>Position preview.</h2>
          <div className="options-position-card">
            <span>{symbol} · {optionType.toUpperCase()}</span>
            <strong>{formatUsd(strike)} strike · {expiration}</strong>
            <p>Premium paid: {formatUsd(premium)} per share · Max loss: {formatUsd(totalPremium)} · Breakeven: {formatUsd(breakeven)}</p>
          </div>
        </article>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Options glossary</p>
            <h2>Key ideas before any simulated trade.</h2>
          </div>
        </div>
        <div className="investment-education-grid-v2">
          {[
            ["Call option", "A call gives the buyer the right, not obligation, to buy an asset at the strike price."],
            ["Put option", "A put gives the buyer the right, not obligation, to sell an asset at the strike price."],
            ["Strike price", "The fixed price used to calculate whether an option has value at expiration."],
            ["Expiration", "The date when the option contract ends. After expiration it may be worthless."],
            ["Premium", "The price paid to buy the option. For buyers, this is the maximum loss."],
            ["Breakeven", "The underlying price needed at expiration to recover the premium paid."],
            ["Risk", "Options can move quickly and expire worthless, so exposure is capped in this simulation."],
            ["Leverage", "A small premium controls 100 shares, which can magnify both gains and losses."]
          ].map(([title, body]) => (
            <article className="lesson-card stack-sm" key={title}>
              <span className="mini-status open">Options</span>
              <h3>{title}</h3>
              <p className="muted">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
