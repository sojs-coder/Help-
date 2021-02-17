function replAuth(data,next){
fetch('https://cors-anywhere.herokuapp.com/https://repl.it/login', {
				method: 'POST',
				body: JSON.stringify({
					username: data.username,
					password: data.password
				}),
				headers: {
					'Content-Type': 'application/json',
					'X-Requested-With': 'fetch',
					'Origin': window.location.origin,
					'Referrer': 'https://repl.it/login'
				}
			})
			.then(res => res.json())
			.then(json => {
				if(json.hasOwnProperty('message')){
					
				}
				else{
					try{
						if(next){
              next(true);
            }
					}
					catch(e){
						console.log(e)
					}
				}
			})
			.catch(e => {console.log(e)})
}