<template>
  <v-container fluid style="height: 100%">
    <v-row no-gutters>
      <v-card width="100%" flat>
        <v-card-title>Timeline of Western colonialism</v-card-title>
        <v-card-text>
          <v-card
            style="width: 100%; height: 46px"
            class="px-4 neutral darken-3 mb-4"
            dark
          >
            <v-slider
              v-model="year"
              :max="max"
              :min="min"
              hide-details
              class="align-center"
            >
              <template v-slot:append>
                <v-btn
                  icon
                  small
                  @click.stop="year--"
                  @mousedown="decreaseYear"
                  @touchstart="decreaseYear"
                  @mouseleave="stopYear"
                  @mouseup="stopYear"
                  @touchend="stopYear"
                  class="align-self-center"
                  title="Previous Year"
                >
                  <v-icon> mdi-minus </v-icon></v-btn
                >
                <span class="align-self-center px-1">{{ year }}</span>
                <v-btn
                  icon
                  small
                  @click.stop="year++"
                  @mousedown="increaseYear"
                  @touchstart="increaseYear"
                  @mouseleave="stopYear"
                  @mouseup="stopYear"
                  @touchend="stopYear"
                  class="align-self-center mr-1"
                  title="Next Year"
                >
                  <v-icon> mdi-plus </v-icon></v-btn
                >
              </template>
              <template v-slot:prepend>
                <v-btn
                  icon
                  @click.stop="toggleAnimation"
                  :title="!playing ? 'Play Animation' : 'Pause Animation'"
                >
                  <v-icon>
                    {{ !playing ? "mdi-play" : "mdi-pause" }}
                  </v-icon></v-btn
                >
                <v-menu offset-y :close-on-click="closeOnClick">
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      class="align-self-center"
                      icon
                      small
                      v-bind="attrs"
                      v-on="on"
                      title="Animation Speed"
                      ><v-icon> mdi-play-speed </v-icon>
                    </v-btn>
                  </template>

                  <v-list dense>
                    <v-list-item @click="speed = 1200">
                      <v-list-item-title>0.5x</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="speed = 600">
                      <v-list-item-title>1x</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="speed = 300">
                      <v-list-item-title>2x</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-slider>
          </v-card>
          <v-card class="neutral lighten-4 my-4" flat>
            <v-card-title v-if="event !== null" class="headline">
              {{ event[0] }}
            </v-card-title>
            <v-card-text v-if="event !== null" v-html="event[1]"></v-card-text>
          </v-card>
          <span class="subtitle-1">
            Sources:
            <ul>
              <li v-for="src in sources" :key="src.title">
                <a :href="src.url">{{ src.title }}</a>
              </li>
            </ul>
          </span>
        </v-card-text>
      </v-card>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import wtf from "wtf_wikipedia";

export default {
  name: "TimelineContent",
  data() {
    return {
      min: 1400,
      max: new Date().getFullYear(),
      playing: false,
      speed: 600,
      event: null,
      tmpTimeline: null,
      closeOnClick: true,
      sources: [
        {
          url: "https://doi.org/10.7910/DVN/T9SDEW",
          title: "Colonial Dates Dataset (COLDAT) ",
        },
        {
          url:
            "https://en.wikipedia.org/wiki/Chronology_of_Western_colonialism",
          title: "Chronology of Western colonialism",
        },
      ],
    };
  },
  computed: {
    ...mapGetters(["colSliderStart", "timeline"]),
    year: {
      get() {
        return this.colSliderStart;
      },
      set(val) {
        this.$store.dispatch("colSliderStart", val);
      },
    },
  },
  methods: {
    increaseYear() {
      if (this.playing) {
        this.stopAnimation();
      }
      if (!this.interval) {
        this.interval = setInterval(() => this.year++, 120);
      }
    },
    decreaseYear() {
      if (this.playing) {
        this.stopAnimation();
      }
      if (!this.interval) {
        this.interval = setInterval(() => this.year--, 120);
      }
    },
    stopYear() {
      clearInterval(this.interval);
      this.interval = false;
    },
    getEvent(val) {
      let arr = [];
      for (let [key, value] of Object.entries(this.tmpTimeline)) {
        const keyStartTime = key.substring(0, 4);
        if (keyStartTime <= val && keyStartTime > this.min) {
          arr[0] = key;
          arr[1] = this.replaceWikiLinks(value.text);
          delete this.tmpTimeline[key];
          if (arr.length > 0) {
            this.event = arr;
          }
          const features = [
            {
              type: "Feature",
              properties: {
                year: arr[0],
                description: arr[1],
              },
              geometry: value.geometry,
            },
          ];
          this.$store.dispatch("colEventPoint", features);
        }
      }
    },
    replaceWikiLink(value) {
      const links = wtf(value).links();
      let text = [];
      let result = [];
      text[0] = wtf(value).text();
      if (links.length === 0) {
        return text[0];
      } else {
        for (let i = 0; i < links.length; i++) {
          if (links[i].data.text) {
            const URL =
              "<a href='https://en.wikipedia.org/wiki/" +
              links[i].data.page.split(" ").join("_") +
              "'>" +
              links[i].data.text +
              "</a>";
            text[i] = text[i].replace(links[i].data.text, URL);
            text[i + 1] = text[i].split("</a>").pop();
            result.push(text[i].split("</a>").shift() + "</a>");
            if (i == links.length - 1) {
              result.push(text.pop());
            }
          } else {
            const URL =
              "<a href='https://en.wikipedia.org/wiki/" +
              links[i].data.page.split(" ").join("_") +
              "'>" +
              links[i].data.page +
              "</a>";
            text[i] = text[i].replace(links[i].data.page, URL);
            text[i + 1] = text[i].split("</a>").pop();
            result.push(text[i].split("</a>").shift() + "</a>");
            if (i == links.length - 1) {
              result.push(text.pop());
            }
          }
        }
      }
      return result.join("");
    },
    replaceWikiLinks(value) {
      if (Array.isArray(value)) {
        let result = [];
        for (let i = 0; i < value.length; i++) {
          result.push(this.replaceWikiLink(value[i]));
        }
        return result.join("\n");
      } else {
        return this.replaceWikiLink(value);
      }
    },
    playAnimation(s) {
      if (this.playing || s === "begin") {
        this.playing = true;
        setTimeout(() => {
          if (this.year < this.max) {
            this.year++;
            this.playAnimation();
          } else {
            this.playing = false;
            return;
          }
        }, this.speed);
      }
    },
    stopAnimation() {
      this.playing = false;
    },
    toggleAnimation() {
      if (this.playing) {
        this.stopAnimation();
      } else {
        this.playAnimation("begin");
      }
    },
  },
  watch: {
    year(val, old) {
      if (this.timeline) {
        if (val <= old) {
          this.tmpTimeline = JSON.parse(JSON.stringify(this.timeline));
          this.getEvent(val);
        }
        if (val > old) {
          this.getEvent(val);
        }
      }
    },
    timeline(v) {
      if (v) {
        this.tmpTimeline = JSON.parse(JSON.stringify(v));
      }
    },
  },
  mounted() {
    this.tmpTimeline = JSON.parse(JSON.stringify(this.timeline));
  },
};
</script>

<style>
.snack-text a {
  color: var(--v-secondary-lighten3) !important;
}
</style>