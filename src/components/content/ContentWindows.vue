<template>
  <div ref="tabItemsWrapper" class="full-height" v-if="mounted">
    <keep-alive>
      <v-window
        v-if="pinned === 0"
        :value="pinned"
        reverse
        style="overflow-y: auto"
        :touch="{ left: onSwipeLeft, right: onSwipeRight }"
      >
        <ContentList />
      </v-window>
    </keep-alive>
    <v-window
      v-if="pinned !== 0"
      :value="active"
      class="full-height"
      style="overflow-y: auto; background-color: white"
      :touch="{ left: onSwipeLeft, right: onSwipeRight }"
    >
      <v-window-item
        v-for="item in resources"
        :key="item.id"
        :class="!$vuetify.breakpoint.smAndDown ? 'full-height' : null"
      >
        <active-tab-item v-if="item.type === 'audio' || item.type === 'map'" />
        <gallery-content
          v-if="item.type === 'gallery'"
          :class="!$vuetify.breakpoint.smAndDown ? 'full-height' : null"
        />
        <timeline-content v-if="item.type === 'timeline'" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { eventBus } from "@/main";

import ContentList from "@/components/content/ContentList";
import GalleryContent from "@/components/content/GalleryContent.vue";
import TimelineContent from "./TimelineContent.vue";
import ActiveTabItem from "./ActiveTabItem.vue";

export default {
  name: "ContentWindows",
  components: {
    ContentList,
    GalleryContent,
    TimelineContent,
    ActiveTabItem,
  },
  data() {
    return {
      active: null,
      pinned: 0,
      mounted: false,
    };
  },
  computed: {
    ...mapGetters(["resources", "tabs", "currentUUID", "currentItem"]),
    windowHeight() {
      return this.$vuetify.breakpoint.height;
    },
  },
  methods: {
    onSwipeLeft() {},
    onSwipeRight() {},
    updateTab(id) {
      if (Number.isInteger(id)) {
        this.active = id;
        this.pinned = 1;
      } else {
        this.active = -1;
        this.pinned = 0;
      }
    },
    resetTabs() {
      this.active = null;
      this.pinned = 0;
    },
  },
  mounted() {
		if (this.currentUUID) {
			this.active = this.tabs[this.currentUUID].active;
			this.pinned = this.tabs[this.currentUUID].pinned;
		}
    this.mounted = true;
    this.$nextTick(() => {
      this.$store.commit(
        "tabItemsHeight",
        this.$refs.tabItemsWrapper.offsetHeight
      );
    });
  },
  created() {
    eventBus.$on("updateTab", this.updateTab);
    eventBus.$on("openScene", this.resetTabs);
    eventBus.$on("openNextScene", this.resetTabs);
  },
  watch: {
    windowHeight() {
      this.$store.commit(
        "tabItemsHeight",
        this.$refs.tabItemsWrapper.offsetHeight
      );
    },
  },
};
</script>