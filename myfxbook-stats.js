
exports.handler = async () => {
  const fetch = (await import('node-fetch')).default;

  try {
    const email = process.env.MYFXBOOK_EMAIL;
    const password = process.env.MYFXBOOK_PASSWORD;
    const accountId = process.env.MYFXBOOK_ACCOUNT_ID;

    const loginRes = await fetch(
      `https://www.myfxbook.com/api/login.json?email=${email}&password=${password}`
    );
    const login = await loginRes.json();

    if (login.error) throw new Error(login.message);

    const session = login.session;

    const accRes = await fetch(
      `https://www.myfxbook.com/api/get-my-accounts.json?session=${session}`
    );
    const accounts = await accRes.json();

    const acc = accounts.accounts.find(a => String(a.id) === String(accountId));
    if (!acc) throw new Error("Account not found");

    const histRes = await fetch(
      `https://www.myfxbook.com/api/get-history.json?session=${session}&id=${accountId}`
    );
    const history = await histRes.json();

    let last50Trades = 0;
    let last50Wins = 0;

    if (!history.error && history.history) {
      const trades = history.history.filter(t => typeof t.profit === "number");
      last50Trades = trades.length;
      last50Wins = trades.filter(t => t.profit > 0).length;
    }

    await fetch(`https://www.myfxbook.com/api/logout.json?session=${session}`);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: false,
        currency: acc.currency,
        gain: acc.gain,
        balance: acc.balance,
        profit: acc.profit,
        drawdown: acc.drawdown,
        last50Trades,
        last50Wins
      })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: true, message: e.message })
    };
  }
};
