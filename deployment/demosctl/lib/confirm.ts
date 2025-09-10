import readline from "readline";

export async function confirm(message: string, confirmStrings: string[], strict: boolean = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((res) => {
    rl.question(`${message}`, (ans) => {
      rl.close();

      let match: string[];

      if (!strict) {
        ans = ans.toLowerCase().trim()
        match = confirmStrings.map(v => v.toLowerCase())
      } else {
        match = confirmStrings
      }
      
      res(match.includes(ans));
    })
  })

}
