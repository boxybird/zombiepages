const vue = new Vue({ 
  el: '#app',

  data() {
    return {
      notes: [],
      newNote: '',
      location: null,
      lat: 45.3343245,
      lng: -302.3534246,
      user: null,
      username: '',
      password: ''
    }
  },  
  
  created() {
    this.getUser()
  },

  // updated() {
  //   window.scrollTo({
  //     left: 0,
  //     top: document.body.scrollHeight,
  //     behavior: 'smooth'
  //   })
  // },

  watch: {
    notes() {
      setTimeout(() => {
        window.scrollTo({
          left: 0,
          top: document.body.scrollHeight,
          behavior: 'smooth'
        })
      }, 1000);
    } 
  },

  methods: {
    login() {
      const postData = {
        username: this.username,
        password: this.password
      }

      axios.post('https://notes.andrewrhyand.com/wp-json/simple-jwt-authentication/v1/token', postData).then(({ data }) => {
        this.user = data
        this.storeUser(data)
        this.fetchNotes()
      })
    },
    
    storeUser(data) {
      localStorage.setItem('user', JSON.stringify(data))
    },

    getLocation() {
      if(!("geolocation" in navigator)) {
        window.alert("Geolocation is not available")
        return
      }

      //get location
      navigator.geolocation.getCurrentPosition(pos => {
      
        this.lat = pos.coords.latitude
        this.lng = pos.coords.longitude

        const api = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.lng}&appid=${this.user.open_weather_api_key}&units=imperial`

          fetch(api)
            .then(response => {
              return response.json()
            })
            .then(data => {
              // const {name} = data
              this.location = data;
            });

      }, err => {
        window.alert("Don't be a dick. Give us your location")
      })
    },

    getUser() {
      let user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

      // If user TRUE try to validate token with API
      if (user) {
        axios.post('https://notes.andrewrhyand.com/wp-json/simple-jwt-authentication/v1/token/refresh', {}, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        })
        .then(({ data }) => {
          this.user = data
          this.storeUser(data) 
          this.fetchNotes()
          this.getLocation()
        })
        .catch((error) => {
          localStorage.removeItem('user')
        })
      }


    },

    //Add code to prevent empty note from being submitted
    saveNote() {
      axios.post('https://notes.andrewrhyand.com/wp-json/bb-notes/v1/notes', {
        content: this.newNote,
        location: this.location,
        latitude: this.lat,
        longitude: this.lng
      },
      {
        headers: {
          Authorization: `Bearer ${this.user.token}`
        }
      })
      .then(({ data }) => {
        this.fetchNotes()
        this.newNote = ''
        // window.scrollTo({
        //   left: 0,
        //   top: document.body.scrollHeight,
        //   behavior: 'smooth'
        // })
      })
      .catch((error) => {
        // Handle the error
        console.log(error.response.data.data.error.message);
        window.alert(error.response.data.data.error.message);
      })
    },

    fetchNotes() {
      // Testing API call
      axios.get('https://notes.andrewrhyand.com/wp-json/bb-notes/v1/notes', {
        headers: {
          Authorization: `Bearer ${this.user.token}`
        }
      })
      .then(({ data }) => {
        this.notes = data
      })
    },

    feedBrain(noteId) {
      //Add "likes" to notes
       axios.post(`https://notes.andrewrhyand.com/wp-json/bb-notes/v1/notes/${noteId}/feedbrain`, null,
       {
         headers: {
           Authorization: `Bearer ${this.user.token}`
         }
       })
       .then(({ data: { data } }) => {
          const currentNote = this.notes.filter(note => {
            return note.id === noteId
          })

          currentNote[0].brain_count = data.brain_count
       })
    },
  } 
})